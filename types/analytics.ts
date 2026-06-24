// Output shapes for the Trading Analytics module. All values are derived from
// the trading journal (see services/tradingAnalyticsService.ts). Monetary
// figures are raw PnL in each asset's native unit, aggregated like the existing
// portfolio (treated as a single base for display via formatBase).

export interface GeneralStats {
  totalTrades: number; // open + closed
  closedTrades: number; // trades with a realized result
  openTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number; // % of closed trades that are winners (0 when none)
  averageWin: number; // mean PnL of winners (>= 0)
  averageLoss: number; // mean of |PnL| of losers (>= 0)
  grossProfit: number; // Σ winning PnL
  grossLoss: number; // Σ |losing PnL|
  netPnl: number; // grossProfit - grossLoss
  profitFactor: number; // grossProfit / grossLoss (Infinity if no losses)
  expectancy: number; // mean PnL per closed trade
  bestTrade: number; // largest single winning PnL (0 when none)
  worstTrade: number; // largest single losing PnL, negative (0 when none)
}

export interface RiskStats {
  maxDrawdown: number; // largest peak-to-trough drop of the equity curve (>= 0)
  maxDrawdownPercent: number; // relative to the peak equity (0 when n/a)
  bestWinStreak: number; // longest run of consecutive winners
  worstLossStreak: number; // longest run of consecutive losers
  payoffRatio: number; // averageWin / averageLoss (Infinity if no losses)
  recoveryFactor: number; // netPnl / maxDrawdown (Infinity if no drawdown)
  resultsVolatility: number; // standard deviation of closed-trade PnL
  averageRisk: number; // mean capital deployed per closed trade (entry × |qty|)
}

// Aggregate stats for one trade direction (LONG or SHORT).
export interface DirectionStats {
  direction: 'LONG' | 'SHORT';
  trades: number;
  closedTrades: number;
  netPnl: number;
  winRate: number;
  profitFactor: number;
}

// A performance slice (weekday, month, hour, …). `key` is stable and
// language-independent; the UI resolves a localized label from it.
export interface BucketPerf {
  key: string;
  trades: number; // closed trades in the bucket
  netPnl: number;
  winRate: number;
}

export interface DurationStats {
  available: boolean; // true only when at least one trade has open+close times
  averageWinningMs: number | null;
  averageLosingMs: number | null;
  ratio: number | null; // winning duration / losing duration
  sampleSize: number; // trades that contributed
}

export interface TimeStats {
  byWeekday: BucketPerf[]; // keys "0".."6" (JS getDay, 0 = Sunday)
  byWeek: BucketPerf[]; // keys "YYYY-MM-DD" (week's Monday), chronological
  byMonth: BucketPerf[]; // keys "YYYY-MM", chronological
  byHour: BucketPerf[]; // keys "0".."23", only hours with trades
  duration: DurationStats;
  bestDay: BucketPerf | null; // most profitable weekday
  worstDay: BucketPerf | null; // least profitable weekday
  bestHour: BucketPerf | null; // most profitable entry hour
  worstHour: BucketPerf | null; // least profitable entry hour
}

export interface AssetPerf {
  symbol: string;
  trades: number; // open + closed for the symbol
  closedTrades: number;
  netPnl: number;
  winRate: number;
  averagePnl: number; // netPnl / closedTrades
  averageDurationMs: number | null; // mean holding time (timed closed trades)
}

// One bar of the win/loss distribution histogram.
export interface HistogramBin {
  lowerEdge: number;
  upperEdge: number;
  count: number;
  isWin: boolean; // bin centered on a positive PnL
}

export interface TradingScore {
  totalScore: number; // 0..100
  performanceScore: number; // 0..40
  riskScore: number; // 0..30
  consistencyScore: number; // 0..20
  disciplineScore: number; // 0..10
}

// One point of the account equity curve (initial capital + cumulative
// realized PnL of closed trades, in chronological order).
export interface EquityPoint {
  index: number;
  value: number;
}

export interface AnalyticsReport {
  hasTrades: boolean; // at least one trade (open or closed)
  hasData: boolean; // at least one closed trade (enables most stats)
  general: GeneralStats;
  risk: RiskStats;
  time: TimeStats;
  assets: AssetPerf[]; // all symbols, sorted by netPnl desc
  topAssets: AssetPerf[]; // best ranked (closed trades only)
  worstAssets: AssetPerf[]; // worst ranked (closed trades only)
  long: DirectionStats; // LONG-only aggregate
  short: DirectionStats; // SHORT-only aggregate
  score: TradingScore;
  equityCurve: EquityPoint[];
  pnlHistogram: HistogramBin[]; // win/loss distribution
}

export type InsightTone = 'positive' | 'negative' | 'neutral';

export interface TradingInsight {
  id: string;
  tone: InsightTone;
  text: string; // already localized
}
