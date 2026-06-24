// Strict types for the (isolated) AI Market Analyst Engine. Nothing here depends
// on the rest of the app's domain types — the service adapts external data into
// these shapes, so the brick stays self-contained and easy to evolve
// (streaming, multi-timeframe, setup scoring, AI coach…).

export type AnalysisTimeframe = 'intraday' | 'swing' | 'position';

export type MarketBias = 'bullish' | 'bearish' | 'neutral';

// One historical sample fed to the engine (close + optional volume).
export interface SeriesPoint {
  time: string; // ISO
  close: number;
  volume: number | null;
}

// --- Input ----------------------------------------------------------------

export interface OpenPositionContext {
  hasPosition: boolean;
  direction?: 'LONG' | 'SHORT';
  entryPrice?: number;
}

export interface MarketAnalysisInput {
  asset: string; // UI symbol
  assetName: string;
  timeframe: AnalysisTimeframe;
  currentPrice: number;
  changePercent: number | null;
  latestCandle: { open: number; high: number; low: number; close: number } | null;
  series: SeriesPoint[]; // chronological
  volume: { current: number | null; average: number | null; ratio: number | null };
  volatility: { ratio: number | null; level: string | null };
  levels: { support: number[]; resistance: number[]; recentHigh: number | null; recentLow: number | null };
  signals: string[]; // detected signal kinds from the market scanner
  opportunityScore: number; // 0..100
  position: OpenPositionContext;
  generatedAt: string; // ISO
}

// --- Output ---------------------------------------------------------------

export interface ExecutiveSummary {
  bias: MarketBias;
  conviction: number; // 0..100
  headline: string;
  text: string;
}

export interface MarketStructure {
  trend: 'uptrend' | 'downtrend' | 'range';
  description: string;
  volatilityRegime: string;
  momentum: string;
}

export interface KeyLevel {
  kind: 'support' | 'resistance' | 'pivot';
  price: number;
  note: string;
}

export interface TradeScenario {
  id: string;
  name: string;
  bias: MarketBias;
  probability: number; // 0..100
  trigger: string; // conditional trigger ("if price reclaims X…")
  target: number | null;
  invalidation: number | null;
  rationale: string;
}

export interface RiskModel {
  suggestedRiskReward: number; // e.g. 2 → 1:2
  stopDistancePercent: number | null; // volatility-adjusted, % of price
  positionSizingNote: string;
  maxRiskNote: string;
}

export interface MarketAnalysisOutput {
  asset: string;
  assetName: string;
  timeframe: AnalysisTimeframe;
  executiveSummary: ExecutiveSummary;
  marketStructure: MarketStructure;
  keyLevels: KeyLevel[];
  scenarios: TradeScenario[];
  tradePlan: string[]; // conditional plan steps (never a direct buy/sell)
  riskModel: RiskModel;
  invalidation: string[]; // invalidation rules
  macroContext: string;
  source: 'local' | 'llm';
  timestamp: string; // ISO
}

// Cached entry shape.
export interface CachedAnalysis {
  output: MarketAnalysisOutput;
  expiresAt: number;
}
