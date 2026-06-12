import axios from 'axios';
import { resolveAsset } from './assetRegistry';
import { getBinanceKlines } from './binanceApi';
import { getStockQuote } from './financeApi';
import { HistoricalPoint, HistoricalSeries, HistoryRange } from '../types/history';

// Optional — when set, US stocks/ETFs get real charts via Alpha Vantage.
// Without it the service falls back to Stooq, then to a synthetic series.
const ALPHAVANTAGE_API_KEY = process.env.EXPO_PUBLIC_ALPHAVANTAGE_API_KEY ?? '';
const ALPHAVANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Per-range tuning for each source. Binance uses native kline intervals;
// the mock walk uses pointCount to decide how many steps to render.
const RANGE_CONFIG: Record<
  HistoryRange,
  { binanceInterval: string; binanceLimit: number; days: number; pointCount: number }
> = {
  '1D': { binanceInterval: '15m', binanceLimit: 96, days: 1, pointCount: 96 },
  '1W': { binanceInterval: '1h', binanceLimit: 168, days: 7, pointCount: 84 },
  '1M': { binanceInterval: '4h', binanceLimit: 180, days: 30, pointCount: 90 },
  '3M': { binanceInterval: '1d', binanceLimit: 90, days: 90, pointCount: 90 },
  '1Y': { binanceInterval: '1d', binanceLimit: 365, days: 365, pointCount: 120 },
};

/**
 * Fetch a historical price series for any registry asset, independent of
 * Finnhub candles. Source is chosen by the asset's data feed with a graceful
 * fallback chain, so the chart always has something to render:
 *
 *   Binance assets → Binance klines (real, free)
 *   Everything else → Alpha Vantage → Stooq → synthetic random walk
 */
export async function getHistoricalPrices(
  symbol: string,
  range: HistoryRange
): Promise<HistoricalSeries> {
  const asset = resolveAsset(symbol);
  const config = RANGE_CONFIG[range];

  if (asset.source === 'binance') {
    try {
      const points = await getBinanceKlines(asset.apiSymbol, config.binanceInterval, config.binanceLimit);
      return { points, source: 'binance', isFallback: false };
    } catch {
      // fall through to the synthetic series below
    }
  } else {
    const alphaVantage = await tryAlphaVantage(asset.apiSymbol, range).catch(() => null);
    if (alphaVantage) return { points: alphaVantage, source: 'alphavantage', isFallback: false };

    const stooq = await tryStooq(asset.apiSymbol, range, config.days).catch(() => null);
    if (stooq) return { points: stooq, source: 'stooq', isFallback: false };
  }

  return { points: await buildMockSeries(symbol, range), source: 'mock', isFallback: true };
}

// --- Alpha Vantage (US stocks/ETFs) ---------------------------------------

async function tryAlphaVantage(apiSymbol: string, range: HistoryRange): Promise<HistoricalPoint[]> {
  if (!ALPHAVANTAGE_API_KEY) throw new Error('no key');

  const intraday = range === '1D';
  const { data } = await axios.get(ALPHAVANTAGE_BASE_URL, {
    params: intraday
      ? {
          function: 'TIME_SERIES_INTRADAY',
          symbol: apiSymbol,
          interval: '15min',
          outputsize: 'compact',
          apikey: ALPHAVANTAGE_API_KEY,
        }
      : {
          function: 'TIME_SERIES_DAILY',
          symbol: apiSymbol,
          outputsize: range === '1Y' || range === '3M' ? 'full' : 'compact',
          apikey: ALPHAVANTAGE_API_KEY,
        },
  });

  // Rate-limit / error responses come back as { Note } / { Information } / { "Error Message" }.
  const seriesKey = Object.keys(data).find((key) => key.includes('Time Series'));
  if (!seriesKey) throw new Error('no series');

  const series = data[seriesKey] as Record<string, Record<string, string>>;
  const points = Object.entries(series)
    .map(([time, ohlc]) => ({
      time: new Date(time).toISOString(),
      price: parseFloat(ohlc['4. close']),
    }))
    .filter((point) => Number.isFinite(point.price) && point.price > 0)
    .sort((a, b) => a.time.localeCompare(b.time));

  return sliceByRange(points, range);
}

// --- Stooq (free CSV, no key) ---------------------------------------------

async function tryStooq(
  apiSymbol: string,
  range: HistoryRange,
  days: number
): Promise<HistoricalPoint[]> {
  // Stooq quotes US tickers as "aapl.us".
  const stooqSymbol = `${apiSymbol.toLowerCase()}.us`;
  const { data } = await axios.get<string>('https://stooq.com/q/d/l/', {
    params: { s: stooqSymbol, i: 'd' },
    responseType: 'text',
  });

  const lines = String(data).trim().split('\n');
  // A valid CSV starts with the header row; anything else (e.g. an anti-bot
  // HTML challenge page) means Stooq didn't serve data — reject and fall back.
  if (!lines[0]?.toLowerCase().startsWith('date,')) throw new Error('not csv');

  const points = lines
    .slice(1)
    .map((line) => {
      const [date, , , , close] = line.split(',');
      return { time: new Date(date).toISOString(), price: parseFloat(close) };
    })
    .filter((point) => Number.isFinite(point.price) && point.price > 0);

  if (points.length === 0) throw new Error('empty');
  return sliceByDays(points, days);
}

// --- Synthetic fallback ----------------------------------------------------

/**
 * Build a deterministic random-walk series that ends at the asset's current
 * price (when available). Deterministic per symbol+range so the chart doesn't
 * twitch between renders. This is a temporary fallback, not real market data.
 */
async function buildMockSeries(symbol: string, range: HistoryRange): Promise<HistoricalPoint[]> {
  const config = RANGE_CONFIG[range];
  const currentPrice = await getStockQuote(symbol)
    .then((quote) => quote.currentPrice)
    .catch(() => 100);

  const random = makeSeededRandom(`${symbol}:${range}`);
  const count = config.pointCount;

  // Walk forward from a starting price, then rescale so the last point equals
  // the real current price — keeps the right-hand edge accurate.
  const raw: number[] = [];
  let value = currentPrice;
  const volatility = 0.012; // ~1.2% per step
  for (let i = 0; i < count; i++) {
    raw.push(value);
    const drift = (random() - 0.5) * 2 * volatility;
    value = Math.max(value * (1 + drift), 0.0001);
  }
  raw.reverse(); // oldest first
  const scale = currentPrice / raw[raw.length - 1];

  const now = Date.now();
  const stepMs = (config.days * 24 * 60 * 60 * 1000) / count;

  return raw.map((price, i) => ({
    time: new Date(now - (count - 1 - i) * stepMs).toISOString(),
    price: price * scale,
  }));
}

// Tiny seeded PRNG (mulberry32) so mock series are stable per symbol+range.
function makeSeededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Range slicing helpers -------------------------------------------------

function sliceByRange(points: HistoricalPoint[], range: HistoryRange): HistoricalPoint[] {
  return sliceByDays(points, RANGE_CONFIG[range].days);
}

function sliceByDays(points: HistoricalPoint[], days: number): HistoricalPoint[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const filtered = points.filter((point) => new Date(point.time).getTime() >= cutoff);
  // Some feeds (e.g. 1D on a daily-only source) may have nothing in-window;
  // fall back to the most recent points so the chart isn't empty.
  if (filtered.length >= 2) return filtered;
  return points.slice(-Math.max(2, Math.min(points.length, 30)));
}
