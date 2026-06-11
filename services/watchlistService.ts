import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStockQuotes } from './financeApi';
import { resolveAsset, toUiSymbol } from './assetRegistry';
import { WatchlistItem } from '../types/market';

const STORAGE_KEY = '@market_journal/watchlist';

export const DEFAULT_WATCHLIST_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'BTC'];

// Normalize to canonical UI symbols (uppercase, dedupe, migrate any stored
// API symbols like "BINANCE:BTCUSDT" back to "BTC") so the UI never shows duplicates.
function normalizeSymbols(symbols: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of symbols) {
    if (typeof raw !== 'string' || raw.trim() === '') continue;
    const uiSymbol = toUiSymbol(raw);
    if (seen.has(uiSymbol)) continue;
    seen.add(uiSymbol);
    result.push(uiSymbol);
  }
  return result;
}

export async function loadWatchlistSymbols(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_WATCHLIST_SYMBOLS;

  try {
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return DEFAULT_WATCHLIST_SYMBOLS;

    const normalized = normalizeSymbols(parsed);
    return normalized.length > 0 ? normalized : DEFAULT_WATCHLIST_SYMBOLS;
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
      name: resolveAsset(symbol).name,
      price: quote?.currentPrice ?? null,
      changePercent: quote?.percentChange ?? null,
    };
  });
}
