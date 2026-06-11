import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalDay } from '../types/journal';

const STORAGE_KEY = '@market_journal/journal_days';

export async function loadJournalDays(): Promise<JournalDay[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as JournalDay[];
}

export async function saveJournalDays(days: JournalDay[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(days));
}
