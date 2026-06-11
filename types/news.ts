export type MarketSentiment = 'bullish' | 'bearish' | 'neutral';

export type ImpactLevel = 'low' | 'medium' | 'high';

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  summary: string;
  url?: string;
  sentiment: MarketSentiment;
  impactScore: number;
  impactLevel: ImpactLevel;
  asset?: string;
  priceChangePercent?: number;
}
