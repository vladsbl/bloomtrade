// Strict types for the market scanner. Designed to grow: new detectors only add
// a `SignalKind` and a `MarketSignal` variant — nothing here needs reshaping for
// RSI / MACD / Bollinger / ATR / trend / multi-timeframe additions later.

export type SignalKind =
  | 'BREAKOUT_BULLISH'
  | 'BREAKOUT_BEARISH'
  | 'MOMENTUM_BULLISH'
  | 'MOMENTUM_BEARISH'
  | 'UNUSUAL_VOLUME'
  | 'HIGH_VOLATILITY';

export type SignalTone = 'bullish' | 'bearish' | 'warning' | 'info';

export interface BaseSignal {
  kind: SignalKind;
  tone: SignalTone;
  timestamp: string; // ISO — when the signal was computed
}

export interface BreakoutSignal extends BaseSignal {
  kind: 'BREAKOUT_BULLISH' | 'BREAKOUT_BEARISH';
  level: number; // the broken 20-period high (bullish) or low (bearish)
  distancePercent: number; // |current - level| / level * 100
}

export interface MomentumSignal extends BaseSignal {
  kind: 'MOMENTUM_BULLISH' | 'MOMENTUM_BEARISH';
  return1d: number;
  return5d: number;
  return20d: number;
  streak: number; // consecutive up (bullish) or down (bearish) sessions
}

export type VolatilityLevel = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'EXTREME';

export interface VolatilitySignal extends BaseSignal {
  kind: 'HIGH_VOLATILITY';
  level: VolatilityLevel;
  ratio: number; // recent volatility / average volatility
}

export interface VolumeSignal extends BaseSignal {
  kind: 'UNUSUAL_VOLUME';
  ratio: number; // current volume / 20-period average volume
}

export type MarketSignal = BreakoutSignal | MomentumSignal | VolatilitySignal | VolumeSignal;

export interface OpportunityScore {
  score: number; // 0..100
  breakoutScore: number; // 0..30
  momentumScore: number; // 0..25
  volumeScore: number; // 0..25
  volatilityScore: number; // 0..20
}

// Raw metrics surfaced for the UI and the insight generator (never re-derived
// from elsewhere — single source of truth per scan).
export interface SeriesMetrics {
  current: number | null;
  high20: number | null;
  low20: number | null;
  return1d: number | null;
  return5d: number | null;
  return20d: number | null;
  upStreak: number;
  downStreak: number;
  volatilityRatio: number | null;
  volatilityLevel: VolatilityLevel | null;
  volumeRatio: number | null; // null when volume data is unavailable
}

export interface AssetSignals {
  symbol: string;
  hasData: boolean; // false when there isn't enough history to analyze
  signals: MarketSignal[];
  score: OpportunityScore;
  metrics: SeriesMetrics;
}
