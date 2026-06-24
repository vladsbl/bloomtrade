import axios from 'axios';
import { HistoricalPoint } from '../types/history';
import { StockQuote } from '../types/quote';

// Public market-data host — no API key, no auth, intended for public consumption.
const BINANCE_BASE_URL = 'https://data-api.binance.vision';

const binanceClient = axios.create({ baseURL: BINANCE_BASE_URL });

interface Binance24hrTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  prevClosePrice: string;
  lastPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
}

/**
 * Fetch a 24h ticker for a Binance spot pair (e.g. "BTCUSDT").
 * All numeric fields arrive as strings and are parsed to numbers.
 */
export async function getBinanceQuote(apiSymbol: string): Promise<StockQuote> {
  try {
    const { data } = await binanceClient.get<Binance24hrTicker>('/api/v3/ticker/24hr', {
      params: { symbol: apiSymbol },
    });

    const currentPrice = parseFloat(data.lastPrice);
    if (!Number.isFinite(currentPrice) || currentPrice === 0) {
      throw new Error('empty');
    }

    return {
      symbol: apiSymbol,
      currentPrice,
      change: parseFloat(data.priceChange),
      percentChange: parseFloat(data.priceChangePercent),
      high: parseFloat(data.highPrice),
      low: parseFloat(data.lowPrice),
      open: parseFloat(data.openPrice),
      previousClose: parseFloat(data.prevClosePrice),
    };
  } catch (error) {
    throw new Error(`Impossible de récupérer la cotation Binance pour ${apiSymbol}.`);
  }
}

// Binance kline rows are tuples: [openTime, open, high, low, close, ...].
type BinanceKline = [number, string, string, string, string, ...unknown[]];

/**
 * Fetch historical close prices for a Binance spot pair.
 * `interval` is a Binance kline interval (e.g. "15m", "1h", "1d") and `limit`
 * caps the number of candles returned (max 1000).
 */
export async function getBinanceKlines(
  apiSymbol: string,
  interval: string,
  limit: number
): Promise<HistoricalPoint[]> {
  try {
    const { data } = await binanceClient.get<BinanceKline[]>('/api/v3/klines', {
      params: { symbol: apiSymbol, interval, limit },
    });

    const points = data
      .map((kline) => ({
        time: new Date(kline[0]).toISOString(),
        price: parseFloat(kline[4]),
        volume: parseFloat(kline[5] as string),
      }))
      .filter((point) => Number.isFinite(point.price) && point.price > 0);

    if (points.length === 0) throw new Error('empty');
    return points;
  } catch (error) {
    throw new Error(`Impossible de récupérer l'historique Binance pour ${apiSymbol}.`);
  }
}
