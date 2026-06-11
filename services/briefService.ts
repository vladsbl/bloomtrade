import { getMarketNews } from './financeApi';
import { getMarketOverview } from './marketOverviewService';
import { formatDateKey } from './calendarUtils';
import { getWatchlistQuotes, loadWatchlistSymbols } from './watchlistService';
import { DailyBrief, SentimentCounts } from '../types/brief';
import { MarketSentiment, NewsItem } from '../types/news';

const TOP_NEWS_COUNT = 5;

/**
 * Build the daily market brief from existing data sources (no external AI):
 * market overview, the day's highest-impact news, an aggregate news sentiment,
 * and the average watchlist move. All independent fetches run in parallel.
 */
export async function generateBrief(): Promise<DailyBrief> {
  const [overview, news, symbols] = await Promise.all([
    getMarketOverview().catch(() => []),
    getMarketNews().catch((): NewsItem[] => []),
    loadWatchlistSymbols(),
  ]);

  const watchlistChangePercent = await computeWatchlistChange(symbols);

  const sentimentCounts = countSentiments(news);
  const topNews = [...news].sort((a, b) => b.impactScore - a.impactScore).slice(0, TOP_NEWS_COUNT);

  return {
    date: formatDateKey(new Date()),
    overview,
    topNews,
    globalSentiment: resolveGlobalSentiment(sentimentCounts),
    sentimentCounts,
    watchlistChangePercent,
  };
}

async function computeWatchlistChange(symbols: string[]): Promise<number | null> {
  if (symbols.length === 0) return null;

  const quotes = await getWatchlistQuotes(symbols).catch(() => []);
  const changes = quotes
    .map((quote) => quote.changePercent)
    .filter((change): change is number => change !== null);

  if (changes.length === 0) return null;
  return changes.reduce((sum, change) => sum + change, 0) / changes.length;
}

function countSentiments(news: NewsItem[]): SentimentCounts {
  return news.reduce<SentimentCounts>(
    (counts, item) => {
      counts[item.sentiment] += 1;
      return counts;
    },
    { bullish: 0, bearish: 0, neutral: 0 }
  );
}

function resolveGlobalSentiment(counts: SentimentCounts): MarketSentiment {
  if (counts.bullish > counts.bearish) return 'bullish';
  if (counts.bearish > counts.bullish) return 'bearish';
  return 'neutral';
}
