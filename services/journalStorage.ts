import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trade } from '../types/trade';

const STORAGE_KEY = '@market_journal/trades';

export async function loadTrades(): Promise<Trade[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Trade[];
}

export async function saveTrades(trades: Trade[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}
