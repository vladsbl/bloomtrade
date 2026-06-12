import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalDay } from '../types/journal';

const STORAGE_KEY = '@market_journal/journal_days';

export async function loadJournalDays(): Promise<JournalDay[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  const days = JSON.parse(raw) as JournalDay[];
  // Trades saved before the open/closed status existed always had an exit
  // price, so they're equivalent to closed trades.
  return days.map((day) => ({
    ...day,
    trades: day.trades.map((trade) => ({ ...trade, status: trade.status ?? 'closed' })),
  }));
}

export async function saveJournalDays(days: JournalDay[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(days));
}
