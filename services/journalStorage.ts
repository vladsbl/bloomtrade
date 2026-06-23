import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalDay } from '../types/journal';
import { Trade } from '../types/trade';

const STORAGE_KEY = '@market_journal/journal_days';

// `id` is `Date.now().toString()` at creation, so a numeric id within a sane
// epoch range doubles as the trade's creation/open timestamp.
function timestampFromId(id: string): number | undefined {
  const value = Number(id);
  return Number.isFinite(value) && value >= 1_000_000_000_000 && value <= 4_000_000_000_000
    ? value
    : undefined;
}

// In-memory, non-destructive migrations applied at load (mirrors the existing
// status backfill). Nothing is rewritten to storage until the day is next saved.
function migrateTrade(trade: Trade): Trade {
  return {
    ...trade,
    status: trade.status ?? 'closed',
    openedAt: trade.openedAt ?? timestampFromId(trade.id),
  };
}

export async function loadJournalDays(): Promise<JournalDay[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  const days = JSON.parse(raw) as JournalDay[];
  return days.map((day) => ({
    ...day,
    trades: day.trades.map(migrateTrade),
  }));
}

export async function saveJournalDays(days: JournalDay[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(days));
}
