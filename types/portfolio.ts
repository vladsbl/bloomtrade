export interface Position {
  asset: string; // UI symbol, e.g. "AAPL"
  apiSymbol: string;
  name: string;
  quantity: number; // net signed quantity (LONG +, SHORT -)
  entryPrice: number; // weighted-average entry across the asset's open trades
  currentPrice: number | null; // null when the price is unavailable
  marketValue: number; // currentPrice * |quantity|
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  date: string; // most recent trade date for the asset (YYYY-MM-DD)
}

export interface PortfolioSummary {
  positions: Position[]; // open positions only
  totalValue: number;
  totalCost: number;
  totalUnrealizedPnl: number;
  totalUnrealizedPnlPercent: number;
  totalRealizedPnl: number; // from closed trades
}
