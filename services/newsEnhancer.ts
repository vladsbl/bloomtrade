import { detectRelatedAssets } from './assetDetection';
import { ImpactLevel, MarketSentiment, NewsItem } from '../types/news';

export interface ExpandedSummary {
  context: string;
  summary: string;
  marketImpact: string;
}

const SENTIMENT_TEXT: Record<MarketSentiment, string> = {
  bullish: 'plutôt favorable pour les marchés',
  bearish: 'plutôt défavorable pour les marchés',
  neutral: 'neutre pour les marchés',
};

const IMPACT_TEXT: Record<ImpactLevel, string> = {
  high: 'Impact potentiellement élevé',
  medium: 'Impact modéré',
  low: 'Impact limité',
};

export function expandSummary(news: NewsItem): ExpandedSummary {
  const relatedAssets = detectRelatedAssets(`${news.title} ${news.summary}`);

  const context =
    relatedAssets.length > 0
      ? `Actualité concernant ${relatedAssets.join(', ')}, publiée par ${news.source}.`
      : `Actualité de marché générale publiée par ${news.source}.`;

  const marketImpact = `${IMPACT_TEXT[news.impactLevel]}, ${SENTIMENT_TEXT[news.sentiment]}.`;

  return {
    context,
    summary: news.summary,
    marketImpact,
  };
}
