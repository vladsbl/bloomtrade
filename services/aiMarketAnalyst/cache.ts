import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalysisTimeframe, CachedAnalysis, MarketAnalysisOutput } from './types';

const STORAGE_KEY = '@market_journal/ai_analysis';

// Re-analysing the same asset+timeframe within the TTL is wasteful — serve the
// cached report instead. Intraday goes stale fastest.
const TTL_MS: Record<AnalysisTimeframe, number> = {
  intraday: 15 * 60 * 1000, // 15 min
  swing: 6 * 60 * 60 * 1000, // 6 h
  position: 24 * 60 * 60 * 1000, // 24 h
};

const cacheKey = (symbol: string, timeframe: AnalysisTimeframe) => `${symbol}:${timeframe}`;

// In-memory mirror so repeated reads don't hit AsyncStorage.
let memory: Record<string, CachedAnalysis> | null = null;

async function loadAll(): Promise<Record<string, CachedAnalysis>> {
  if (memory) return memory;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    memory = raw ? (JSON.parse(raw) as Record<string, CachedAnalysis>) : {};
  } catch {
    memory = {};
  }
  return memory;
}

function persist(map: Record<string, CachedAnalysis>): void {
  memory = map;
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map)).catch(() => {});
}

/** Return a fresh cached analysis, or null when missing/expired. */
export async function getCachedAnalysis(
  symbol: string,
  timeframe: AnalysisTimeframe
): Promise<MarketAnalysisOutput | null> {
  const map = await loadAll();
  const entry = map[cacheKey(symbol, timeframe)];
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.output;
}

export async function setCachedAnalysis(output: MarketAnalysisOutput): Promise<void> {
  const map = await loadAll();
  map[cacheKey(output.asset, output.timeframe)] = {
    output,
    expiresAt: Date.now() + TTL_MS[output.timeframe],
  };
  persist(map);
}

export async function clearAnalysisCache(): Promise<void> {
  persist({});
}

// --- Persistent history (browsable past analyses) --------------------------

const HISTORY_KEY = '@market_journal/ai_history';
const HISTORY_LIMIT = 30;

let historyMemory: MarketAnalysisOutput[] | null = null;

async function loadHistory(): Promise<MarketAnalysisOutput[]> {
  if (historyMemory) return historyMemory;
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    historyMemory = raw ? (JSON.parse(raw) as MarketAnalysisOutput[]) : [];
  } catch {
    historyMemory = [];
  }
  return historyMemory;
}

function persistHistory(list: MarketAnalysisOutput[]): void {
  historyMemory = list;
  AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(list)).catch(() => {});
}

/** Past analyses, most recent first — one entry per asset+timeframe. */
export async function getAnalysisHistory(): Promise<MarketAnalysisOutput[]> {
  return [...(await loadHistory())];
}

export async function addAnalysisToHistory(output: MarketAnalysisOutput): Promise<void> {
  const list = await loadHistory();
  const key = cacheKey(output.asset, output.timeframe);
  const next = [
    output,
    ...list.filter((entry) => cacheKey(entry.asset, entry.timeframe) !== key),
  ].slice(0, HISTORY_LIMIT);
  persistHistory(next);
}

/** The stored analysis for an asset+timeframe, ignoring TTL (for history view). */
export async function getHistoryEntry(
  symbol: string,
  timeframe: AnalysisTimeframe
): Promise<MarketAnalysisOutput | null> {
  const list = await loadHistory();
  return list.find((entry) => entry.asset === symbol && entry.timeframe === timeframe) ?? null;
}
