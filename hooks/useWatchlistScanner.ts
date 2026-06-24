import { useCallback, useEffect, useMemo, useState } from 'react';
import { scanWatchlist } from '../services/marketScannerService';
import { notifySignals } from '../services/scannerNotifications';
import { useLanguage } from '../store/i18n';
import { AssetSignals } from '../types/marketSignals';

const TOP_OPPORTUNITIES = 5;

interface UseWatchlistScanner {
  results: Record<string, AssetSignals>; // keyed by UI symbol
  opportunities: AssetSignals[]; // top assets by opportunity score
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Scans the given watchlist symbols (cached in the service) and exposes the
 * per-asset signals + the best opportunities. Re-scans when the symbol set
 * changes; a manual refresh forces a fresh scan. Notifications fire after each
 * scan, throttled by the scanner's anti-spam layer.
 */
export function useWatchlistScanner(symbols: string[]): UseWatchlistScanner {
  const { t } = useLanguage();
  const [results, setResults] = useState<Record<string, AssetSignals>>({});
  const [loading, setLoading] = useState(false);

  // Stable, order-independent key so the scan effect only re-runs on real change.
  const symbolsKey = useMemo(() => [...symbols].sort().join(','), [symbols]);

  const run = useCallback(
    async (force: boolean) => {
      const list = symbolsKey ? symbolsKey.split(',') : [];
      if (list.length === 0) {
        setResults({});
        return;
      }
      setLoading(true);
      const scanned = await scanWatchlist(list, { force }).catch((): AssetSignals[] => []);
      const map: Record<string, AssetSignals> = {};
      for (const asset of scanned) map[asset.symbol] = asset;
      setResults(map);
      setLoading(false);
      notifySignals(scanned, t).catch(() => {});
    },
    [symbolsKey, t]
  );

  useEffect(() => {
    run(false);
  }, [run]);

  const opportunities = useMemo(
    () =>
      Object.values(results)
        .filter((asset) => asset.hasData && asset.score.score > 0)
        .sort((a, b) => b.score.score - a.score.score)
        .slice(0, TOP_OPPORTUNITIES),
    [results]
  );

  return { results, opportunities, loading, refresh: () => run(true) };
}
