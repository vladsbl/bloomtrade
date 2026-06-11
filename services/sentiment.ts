import { ImpactLevel, MarketSentiment } from '../types/news';

const BULLISH_KEYWORDS = ['rise', 'rises', 'rising', 'surge', 'surges', 'beats', 'beat', 'record', 'growth', 'rally', 'gain', 'gains', 'soar', 'soars'];

const BEARISH_KEYWORDS = ['fall', 'falls', 'falling', 'drop', 'drops', 'loss', 'losses', 'crash', 'decline', 'declines', 'plunge', 'plunges', 'slump'];

const HIGH_IMPACT_KEYWORDS = ['earnings', 'crash', 'record', 'fed', 'federal reserve', 'rate hike', 'rate cut', 'inflation', 'recession', 'bankruptcy'];

const HIGH_IMPACT_SOURCES = ['reuters', 'cnbc'];

export function analyzeSentiment(text: string): MarketSentiment {
  const lower = text.toLowerCase();
  const bullishHits = BULLISH_KEYWORDS.filter((keyword) => lower.includes(keyword)).length;
  const bearishHits = BEARISH_KEYWORDS.filter((keyword) => lower.includes(keyword)).length;

  if (bullishHits > bearishHits) return 'bullish';
  if (bearishHits > bullishHits) return 'bearish';
  return 'neutral';
}

export function calculateImpactScore(text: string, source: string): number {
  let score = 50;
  const lower = text.toLowerCase();

  if (HIGH_IMPACT_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    score += 30;
  }
  if (HIGH_IMPACT_SOURCES.includes(source.toLowerCase())) {
    score += 20;
  }

  return Math.min(100, Math.max(0, score));
}

export function getImpactLevel(score: number): ImpactLevel {
  if (score > 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
