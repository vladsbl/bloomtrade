export interface Position {
  asset: string; // UI symbol, e.g. "AAPL"
  apiSymbol: string;
  name: string;
  quantity: number; // net signed quantity (LONG +, SHORT -)
  entryPrice: number; // weighted-average entry across the asset's trades
  currentPrice: number | null; // null when the price is unavailable
  marketValue: number; // currentPrice * |quantity|
  pnl: number;
  pnlPercent: number;
  date: string; // most recent trade date for the asset (YYYY-MM-DD)
}

export interface PortfolioSummary {
  positions: Position[];
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPercent: number;
}
