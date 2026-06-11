import { MarketOverviewItem } from './market';
import { NewsItem, MarketSentiment } from './news';

export interface SentimentCounts {
  bullish: number;
  bearish: number;
  neutral: number;
}

export interface DailyBrief {
  date: string; // YYYY-MM-DD
  overview: MarketOverviewItem[];
  topNews: NewsItem[];
  globalSentiment: MarketSentiment;
  sentimentCounts: SentimentCounts;
  watchlistChangePercent: number | null; // average % change across the watchlist
}
