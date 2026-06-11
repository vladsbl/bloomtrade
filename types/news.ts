export type NewsSentiment = 'positive' | 'negative' | 'neutral';

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  summary: string;
  sentiment?: NewsSentiment;
  url?: string;
}
