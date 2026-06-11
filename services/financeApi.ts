import axios from 'axios';
import { NewsItem } from '../types/news';
import { StockQuote } from '../types/quote';

const FINNHUB_API_KEY = 'YOUR_FINNHUB_API_KEY';
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

export async function getMarketNews(): Promise<NewsItem[]> {
  try {
    const { data } = await finnhubClient.get<FinnhubNewsItem[]>('/news', {
      params: { category: 'general' },
    });

    return data.map((item) => ({
      id: item.id.toString(),
      title: item.headline,
      source: item.source,
      time: formatRelativeTime(item.datetime),
      summary: item.summary,
      url: item.url,
    }));
  } catch (error) {
    throw new Error('Impossible de récupérer les actualités financières.');
  }
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
