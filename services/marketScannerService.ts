import { getHistoricalPrices } from './historicalPriceService';
import { HistoricalPoint, HistoryRange } from '../types/history';
import {
  AssetSignals,
  MarketSignal,
  OpportunityScore,
  SeriesMetrics,
  VolatilityLevel,
} from '../types/marketSignals';

// Tunable thresholds — every detector reads from here so behaviour stays
// configurable and testable.
export const SCANNER_CONFIG = {
  lookback: 20, // periods for highs/lows, average volume, average volatility
  recentWindow: 5, // periods for "recent" volatility
  volatility: { elevated: 1.5, high: 2.0, extreme: 2.5 }, // recent/avg ratio bands
  volumeRatioThreshold: 2.0, // current/avg volume to flag UNUSUAL_VOLUME
  notifyScoreThreshold: 70, // opportunity score that warrants a notification
  cacheTtlMs: 5 * 60 * 1000, // memoize each asset's scan for 5 minutes
  concurrency: 4, // simultaneous history fetches
  range: '3M' as HistoryRange, // daily candles → ~90 sessions
};

// ---------------------------------------------------------------------------
// Detector registry — add a new entry (RSI, MACD, …) here and the scanner picks
// it up automatically. Each detector is a pure function of the precomputed
// metrics, so it never refetches or recomputes the series.
// ---------------------------------------------------------------------------

interface ScanContext {
  symbol: string;
  metrics: SeriesMetrics;
  asOf: string; // ISO time of the latest candle (used as the signal timestamp)
}

type Detector = (ctx: ScanContext) => MarketSignal | null;

const detectBreakout: Detector = ({ metrics, asOf }) => {
  const { current, high20, low20 } = metrics;
  if (current === null || high20 === null || low20 === null) return null;

  if (current > high20) {
    return {
      kind: 'BREAKOUT_BULLISH',
      tone: 'bullish',
      timestamp: asOf,
      level: high20,
      distancePercent: ((current - high20) / high20) * 100,
    };
  }
  if (current < low20) {
    return {
      kind: 'BREAKOUT_BEARISH',
      tone: 'bearish',
      timestamp: asOf,
      level: low20,
      distancePercent: ((low20 - current) / low20) * 100,
    };
  }
  return null;
};

const detectMomentum: Detector = ({ metrics, asOf }) => {
  const { return1d, return5d, return20d, upStreak, downStreak } = metrics;
  if (return1d === null || return5d === null || return20d === null) return null;

  const allUp = return1d > 0 && return5d > 0 && return20d > 0;
  const allDown = return1d < 0 && return5d < 0 && return20d < 0;
  if (!allUp && !allDown) return null;

  return {
    kind: allUp ? 'MOMENTUM_BULLISH' : 'MOMENTUM_BEARISH',
    tone: allUp ? 'bullish' : 'bearish',
    timestamp: asOf,
    return1d,
    return5d,
    return20d,
    streak: allUp ? upStreak : downStreak,
  };
};

const detectVolatility: Detector = ({ metrics, asOf }) => {
  if (metrics.volatilityRatio === null || metrics.volatilityLevel === null) return null;
  if (metrics.volatilityLevel === 'NORMAL') return null;
  return {
    kind: 'HIGH_VOLATILITY',
    tone: 'warning',
    timestamp: asOf,
    level: metrics.volatilityLevel,
    ratio: metrics.volatilityRatio,
  };
};

const detectVolume: Detector = ({ metrics, asOf }) => {
  if (metrics.volumeRatio === null) return null;
  if (metrics.volumeRatio < SCANNER_CONFIG.volumeRatioThreshold) return null;
  return {
    kind: 'UNUSUAL_VOLUME',
    tone: 'warning',
    timestamp: asOf,
    ratio: metrics.volumeRatio,
  };
};

export const DETECTORS: Detector[] = [detectBreakout, detectMomentum, detectVolatility, detectVolume];

// ---------------------------------------------------------------------------
// Metrics — computed once per scan and shared by every detector + the score.
// ---------------------------------------------------------------------------

export function computeMetrics(closes: number[], volumes: number[] | null): SeriesMetrics {
  const n = closes.length;
  const empty: SeriesMetrics = {
    current: null,
    high20: null,
    low20: null,
    return1d: null,
    return5d: null,
    return20d: null,
    upStreak: 0,
    downStreak: 0,
    volatilityRatio: null,
    volatilityLevel: null,
    volumeRatio: null,
  };
  if (n < 2) return empty;

  const { lookback, recentWindow } = SCANNER_CONFIG;
  const current = closes[n - 1];

  const lookbackReturn = (periods: number): number | null =>
    n > periods ? (closes[n - 1] / closes[n - 1 - periods] - 1) * 100 : null;

  // Previous 20-period high/low (excludes the latest close = "prix actuel").
  const previous = closes.slice(0, n - 1);
  const window = previous.slice(-lookback);
  const high20 = window.length >= lookback ? Math.max(...window) : null;
  const low20 = window.length >= lookback ? Math.min(...window) : null;

  // Daily returns (decimal) for volatility.
  const returns: number[] = [];
  for (let i = 1; i < n; i++) returns.push(closes[i] / closes[i - 1] - 1);
  const recentVol = returns.length >= recentWindow ? stdev(returns.slice(-recentWindow)) : null;
  const avgVol = returns.length >= lookback ? stdev(returns.slice(-lookback)) : null;
  const volatilityRatio = recentVol !== null && avgVol !== null && avgVol > 0 ? recentVol / avgVol : null;

  // Volume ratio vs the previous 20-period average.
  let volumeRatio: number | null = null;
  if (volumes && volumes.length === n && n > lookback) {
    const avgVolume = mean(volumes.slice(n - 1 - lookback, n - 1));
    const currentVolume = volumes[n - 1];
    if (avgVolume > 0 && Number.isFinite(currentVolume)) volumeRatio = currentVolume / avgVolume;
  }

  return {
    current,
    high20,
    low20,
    return1d: lookbackReturn(1),
    return5d: lookbackReturn(5),
    return20d: lookbackReturn(20),
    upStreak: streak(closes, 'up'),
    downStreak: streak(closes, 'down'),
    volatilityRatio,
    volatilityLevel: volatilityRatio !== null ? classifyVolatility(volatilityRatio) : null,
    volumeRatio,
  };
}

function classifyVolatility(ratio: number): VolatilityLevel {
  const { elevated, high, extreme } = SCANNER_CONFIG.volatility;
  if (ratio >= extreme) return 'EXTREME';
  if (ratio >= high) return 'HIGH';
  if (ratio >= elevated) return 'ELEVATED';
  return 'NORMAL';
}

function streak(closes: number[], direction: 'up' | 'down'): number {
  let count = 0;
  for (let i = closes.length - 1; i > 0; i--) {
    const up = closes[i] > closes[i - 1];
    const down = closes[i] < closes[i - 1];
    if ((direction === 'up' && up) || (direction === 'down' && down)) count += 1;
    else break;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Opportunity score (0..100): Breakout 30 + Momentum 25 + Volume 25 + Vol 20.
// Long-biased and deterministic — identical inputs always yield the same score.
//   breakout : bullish only → 18 + min(distance/3, 1) * 12 ; else 0
//   momentum : (positive returns / available) * 15 + min(upStreak,5)/5 * 10
//   volume   : min((ratio - 1) / 2, 1) * 25  (ratio 3+ → full) ; n/a → 0
//   vol.     : min((ratio - 1) / 1.5, 1) * 20 (ratio 2.5+ → full)
// ---------------------------------------------------------------------------

export function computeOpportunityScore(
  metrics: SeriesMetrics,
  signals: MarketSignal[]
): OpportunityScore {
  const breakout = signals.find(
    (s): s is Extract<MarketSignal, { kind: 'BREAKOUT_BULLISH' | 'BREAKOUT_BEARISH' }> =>
      s.kind === 'BREAKOUT_BULLISH' || s.kind === 'BREAKOUT_BEARISH'
  );
  const breakoutScore =
    breakout && breakout.kind === 'BREAKOUT_BULLISH'
      ? Math.round(18 + clamp01(breakout.distancePercent / 3) * 12)
      : 0;

  const returns = [metrics.return1d, metrics.return5d, metrics.return20d].filter(
    (r): r is number => r !== null
  );
  const positives = returns.filter((r) => r > 0).length;
  const alignment = returns.length > 0 ? (positives / returns.length) * 15 : 0;
  const streakBonus = (Math.min(metrics.upStreak, 5) / 5) * 10;
  const momentumScore = Math.round(alignment + streakBonus);

  const volumeScore =
    metrics.volumeRatio !== null ? Math.round(clamp01((metrics.volumeRatio - 1) / 2) * 25) : 0;

  const volatilityScore =
    metrics.volatilityRatio !== null
      ? Math.round(clamp01((metrics.volatilityRatio - 1) / 1.5) * 20)
      : 0;

  const score = Math.min(100, breakoutScore + momentumScore + volumeScore + volatilityScore);
  return { score, breakoutScore, momentumScore, volumeScore, volatilityScore };
}

// ---------------------------------------------------------------------------
// Scan orchestration with a per-symbol TTL cache and limited concurrency.
// ---------------------------------------------------------------------------

const cache = new Map<string, { result: AssetSignals; expiresAt: number }>();

function emptyResult(symbol: string): AssetSignals {
  return {
    symbol,
    hasData: false,
    signals: [],
    score: { score: 0, breakoutScore: 0, momentumScore: 0, volumeScore: 0, volatilityScore: 0 },
    metrics: computeMetrics([], null),
  };
}

export function analyzeSeries(symbol: string, points: HistoricalPoint[]): AssetSignals {
  const valid = points.filter((p) => Number.isFinite(p.price) && p.price > 0);
  if (valid.length < 2) return emptyResult(symbol);

  const closes = valid.map((p) => p.price);
  const { lookback } = SCANNER_CONFIG;
  const hasVolume =
    valid.length > lookback &&
    valid.slice(-(lookback + 1)).every((p) => Number.isFinite(p.volume) && (p.volume as number) > 0);
  const volumes = hasVolume ? valid.map((p) => (Number.isFinite(p.volume) ? (p.volume as number) : 0)) : null;

  const metrics = computeMetrics(closes, volumes);
  const ctx: ScanContext = { symbol, metrics, asOf: valid[valid.length - 1].time };
  const signals = DETECTORS.map((detect) => detect(ctx)).filter((s): s is MarketSignal => s !== null);

  return { symbol, hasData: true, signals, score: computeOpportunityScore(metrics, signals), metrics };
}

export async function scanAsset(symbol: string, opts?: { force?: boolean }): Promise<AssetSignals> {
  const cached = cache.get(symbol);
  if (!opts?.force && cached && cached.expiresAt > Date.now()) return cached.result;

  let result: AssetSignals;
  try {
    const series = await getHistoricalPrices(symbol, SCANNER_CONFIG.range);
    result = analyzeSeries(symbol, series.points);
  } catch {
    result = emptyResult(symbol);
  }

  cache.set(symbol, { result, expiresAt: Date.now() + SCANNER_CONFIG.cacheTtlMs });
  return result;
}

/** Scan every watchlist symbol, batched to keep API pressure low. */
export async function scanWatchlist(
  symbols: string[],
  opts?: { force?: boolean }
): Promise<AssetSignals[]> {
  const results: AssetSignals[] = [];
  for (let i = 0; i < symbols.length; i += SCANNER_CONFIG.concurrency) {
    const batch = symbols.slice(i, i + SCANNER_CONFIG.concurrency);
    const scanned = await Promise.all(batch.map((symbol) => scanAsset(symbol, opts)));
    results.push(...scanned);
  }
  return results;
}

// --- numeric helpers -------------------------------------------------------

function mean(values: number[]): number {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
