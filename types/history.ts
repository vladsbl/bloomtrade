export type HistoryRange = '1D' | '1W' | '1M' | '3M' | '1Y';

export const HISTORY_RANGES: HistoryRange[] = ['1D', '1W', '1M', '3M', '1Y'];

// Where a series came from. "mock" is a synthetic random walk used as a
// last-resort fallback so the chart always renders something usable.
export type HistorySource = 'binance' | 'alphavantage' | 'stooq' | 'mock';

export interface HistoricalPoint {
  time: string; // ISO timestamp
  price: number;
  volume?: number; // when the feed provides it (Binance / Stooq / Alpha Vantage)
}

export interface HistoricalSeries {
  points: HistoricalPoint[];
  source: HistorySource;
  // True when the data is the random-walk fallback rather than a real feed.
  isFallback: boolean;
}
