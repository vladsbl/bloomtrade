import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStockQuotes } from './financeApi';
import { WatchlistItem } from '../types/market';

const STORAGE_KEY = '@market_journal/watchlist';

export const DEFAULT_WATCHLIST_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'BTC'];

export async function loadWatchlistSymbols(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_WATCHLIST_SYMBOLS;

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_WATCHLIST_SYMBOLS;
  } catch {
    return DEFAULT_WATCHLIST_SYMBOLS;
  }
}

export async function saveWatchlistSymbols(symbols: string[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
}

export async function getWatchlistQuotes(symbols: string[]): Promise<WatchlistItem[]> {
  const quotes = await getStockQuotes(symbols);
  const quoteBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));

  return symbols.map((symbol) => {
    const quote = quoteBySymbol.get(symbol);
    return {
      symbol,
      price: quote?.currentPrice ?? null,
      changePercent: quote?.percentChange ?? null,
    };
  });
}
