import AsyncStorage from '@react-native-async-storage/async-storage';
import { fillTemplate } from './marketInsightGenerator';
import { SCANNER_CONFIG } from './marketScannerService';
import { sendLocalNotification } from './notificationService';
import { AssetSignals } from '../types/marketSignals';
import { TranslationKey } from '../store/translations';

const STORAGE_KEY = '@market_journal/scanner_notifs';
const COOLDOWN_MS = 6 * 60 * 60 * 1000; // don't repeat a symbol+event within 6h
const MAX_PER_RUN = 3; // burst guard: at most 3 notifications per scan

type Translate = (key: TranslationKey) => string;

interface NotifEvent {
  key: string; // "<symbol>:<event>" — anti-spam identity
  body: string;
}

// Cached in memory so repeated scans don't hit AsyncStorage every time.
let memoryMap: Record<string, number> | null = null;

async function loadMap(): Promise<Record<string, number>> {
  if (memoryMap) return memoryMap;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    memoryMap = raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    memoryMap = {};
  }
  return memoryMap;
}

function persist(map: Record<string, number>): void {
  memoryMap = map;
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map)).catch(() => {});
}

// The notable, notification-worthy events for one asset.
function eventsFor(asset: AssetSignals, t: Translate): NotifEvent[] {
  const events: NotifEvent[] = [];
  const symbol = asset.symbol;

  for (const signal of asset.signals) {
    if (signal.kind === 'BREAKOUT_BULLISH') {
      events.push({ key: `${symbol}:breakout_bull`, body: fillTemplate(t('scanner.insight.breakoutBullish'), { symbol }) });
    } else if (signal.kind === 'BREAKOUT_BEARISH') {
      events.push({ key: `${symbol}:breakout_bear`, body: fillTemplate(t('scanner.insight.breakoutBearish'), { symbol }) });
    } else if (signal.kind === 'UNUSUAL_VOLUME') {
      events.push({ key: `${symbol}:volume`, body: fillTemplate(t('scanner.insight.volume'), { symbol, ratio: signal.ratio.toFixed(1) }) });
    }
  }

  if (asset.score.score >= SCANNER_CONFIG.notifyScoreThreshold) {
    events.push({ key: `${symbol}:score`, body: fillTemplate(t('scanner.notifScore'), { symbol, score: asset.score.score }) });
  }

  return events;
}

/**
 * Fire local notifications for fresh, high-value signals. Best-effort and
 * anti-spam: each symbol+event only re-notifies after a cooldown, and no more
 * than MAX_PER_RUN are sent per scan.
 */
export async function notifySignals(assets: AssetSignals[], t: Translate): Promise<void> {
  const map = await loadMap();
  const now = Date.now();
  let sent = 0;
  let changed = false;

  for (const asset of assets) {
    if (!asset.hasData) continue;
    for (const event of eventsFor(asset, t)) {
      if (sent >= MAX_PER_RUN) break;
      if (now - (map[event.key] ?? 0) < COOLDOWN_MS) continue;
      await sendLocalNotification(t('scanner.notifTitle'), event.body);
      map[event.key] = now;
      changed = true;
      sent += 1;
    }
    if (sent >= MAX_PER_RUN) break;
  }

  if (changed) persist(map);
}
