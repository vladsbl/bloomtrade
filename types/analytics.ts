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
}

export interface RiskStats {
  maxDrawdown: number; // largest peak-to-trough drop of the equity curve (>= 0)
  maxDrawdownPercent: number; // relative to the peak equity (0 when n/a)
  bestWinStreak: number; // longest run of consecutive winners
  worstLossStreak: number; // longest run of consecutive losers
  payoffRatio: number; // averageWin / averageLoss (Infinity if no losses)
  recoveryFactor: number; // netPnl / maxDrawdown (Infinity if no drawdown)
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
  byMonth: BucketPerf[]; // keys "YYYY-MM", chronological
  byHour: BucketPerf[]; // keys "0".."23", only hours with trades
  duration: DurationStats;
}

export interface AssetPerf {
  symbol: string;
  trades: number; // open + closed for the symbol
  closedTrades: number;
  netPnl: number;
  winRate: number;
  averagePnl: number; // netPnl / closedTrades
}

export interface TradingScore {
  score: number; // 0..100
  performanceScore: number; // 0..40
  riskScore: number; // 0..30
  consistencyScore: number; // 0..20
  disciplineScore: number; // 0..10
}

// One point of the cumulative realized-PnL equity curve.
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
  score: TradingScore;
  equityCurve: EquityPoint[];
}

export type InsightTone = 'positive' | 'negative' | 'neutral';

export interface TradingInsight {
  id: string;
  tone: InsightTone;
  text: string; // already localized
}
