import axios from 'axios';
import { detectPrimaryAsset } from './assetDetection';
import { analyzeSentiment, calculateImpactScore, getImpactLevel } from './sentiment';
import { NewsItem } from '../types/news';
import { StockQuote } from '../types/quote';

const MAX_NEWS_ITEMS = 20;

const FINNHUB_API_KEY = process.env.EXPO_PUBLIC_FINNHUB_API_KEY ?? '';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

const finnhubClient = axios.create({
  baseURL: FINNHUB_BASE_URL,
  params: {
    token: FINNHUB_API_KEY,
  },
});

interface FinnhubQuoteResponse {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
}

interface FinnhubNewsItem {
  id: number;
  headline: string;
  source: string;
  summary: string;
  datetime: number;
  url: string;
}

export async function getStockQuote(symbol: string): Promise<StockQuote> {
  try {
    const { data } = await finnhubClient.get<FinnhubQuoteResponse>('/quote', {
      params: { symbol },
    });

    return {
      symbol,
      currentPrice: data.c,
      change: data.d,
      percentChange: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
    };
  } catch (error) {
    throw new Error(`Impossible de récupérer la cotation pour ${symbol}.`);
  }
}

export async function getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
  const quotes = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        return await getStockQuote(symbol);
      } catch {
        return null;
      }
    })
  );

  return quotes.filter((quote): quote is StockQuote => quote !== null);
}

export async function getMarketNews(): Promise<NewsItem[]> {
  try {
    const { data } = await finnhubClient.get<FinnhubNewsItem[]>('/news', {
      params: { category: 'general' },
    });

    const validNews = data
      .filter((item) => !!item.headline && !!item.summary && !!item.source && !!item.datetime)
      .slice(0, MAX_NEWS_ITEMS);

    const enrichedNews = validNews.map((item): NewsItem => {
      const text = `${item.headline} ${item.summary}`;
      const impactScore = calculateImpactScore(text, item.source);

      return {
        id: item.id.toString(),
        title: item.headline,
        source: item.source,
        time: formatRelativeTime(item.datetime),
        summary: item.summary,
        url: item.url,
        sentiment: analyzeSentiment(text),
        impactScore,
        impactLevel: getImpactLevel(impactScore),
        asset: detectPrimaryAsset(text),
      };
    });

    return attachPriceChanges(enrichedNews);
  } catch (error) {
    throw new Error('Impossible de récupérer les actualités financières.');
  }
}

async function attachPriceChanges(news: NewsItem[]): Promise<NewsItem[]> {
  const assets = Array.from(
    new Set(news.map((item) => item.asset).filter((asset): asset is string => !!asset))
  );

  const quotes = await getStockQuotes(assets);
  const percentChangeBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote.percentChange]));

  return news.map((item) => {
    if (!item.asset) return item;

    const percentChange = percentChangeBySymbol.get(item.asset);
    return percentChange === undefined ? item : { ...item, priceChangePercent: percentChange };
  });
}

function formatRelativeTime(timestampSeconds: number): string {
  const diffMinutes = Math.floor((Date.now() - timestampSeconds * 1000) / (1000 * 60));

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} j`;
}
