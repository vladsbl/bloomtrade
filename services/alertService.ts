import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStockQuotes } from './financeApi';
import { PriceAlert } from '../types/alert';

const STORAGE_KEY = '@market_journal/alerts';

export async function loadAlerts(): Promise<PriceAlert[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as PriceAlert[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveAlerts(alerts: PriceAlert[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

/** True when the live price satisfies the alert's condition. */
export function isConditionMet(alert: PriceAlert, price: number): boolean {
  return alert.condition === 'above' ? price >= alert.targetPrice : price <= alert.targetPrice;
}

export interface TriggeredAlert {
  alert: PriceAlert;
  price: number;
}

/**
 * Fetch current prices for all active alerts (one request per unique symbol)
 * and return those whose condition is now met.
 */
export async function checkAlerts(alerts: PriceAlert[]): Promise<TriggeredAlert[]> {
  const active = alerts.filter((alert) => alert.isActive);
  if (active.length === 0) return [];

  const symbols = Array.from(new Set(active.map((alert) => alert.symbol)));
  const quotes = await getStockQuotes(symbols);
  const priceBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote.currentPrice]));

  const triggered: TriggeredAlert[] = [];
  for (const alert of active) {
    const price = priceBySymbol.get(alert.symbol);
    if (price === undefined) continue;
    if (isConditionMet(alert, price)) triggered.push({ alert, price });
  }

  return triggered;
}
