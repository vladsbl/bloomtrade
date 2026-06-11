export interface MarketOverviewItem {
  symbol: string;
  displayName: string;
  price: number;
  changePercent: number;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number | null;
}

export interface TopMoverItem {
  symbol: string;
  changePercent: number;
}

export interface TopMoversData {
  gainers: TopMoverItem[];
  losers: TopMoverItem[];
}
