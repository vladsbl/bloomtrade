import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getStockQuotes } from '../services/financeApi';
import {
  buildOpenPositions,
  collectOpenTrades,
  summarizeAccount,
} from '../services/portfolioAccountingService';
import { useJournalByDate } from '../store/journalByDate';
import { useTradingAccount } from '../store/tradingAccount';
import { AccountSummary, OpenPosition } from '../types/account';

interface UseOpenPositions {
  positions: OpenPosition[];
  summary: AccountSummary;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  closingId: string | null;
  closePosition: (position: OpenPosition) => Promise<void>;
}

/**
 * Live open-position state for the trading account. Quotes refresh on mount,
 * on screen focus, on app foreground, and on pull-to-refresh. Closing a
 * position fetches the latest price, then flips the trade to "closed".
 */
export function useOpenPositions(): UseOpenPositions {
  const { days, updateTrade } = useJournalByDate();
  const { initialCapital, leverage, accountCurrency, realizedPnl } = useTradingAccount();

  const openTrades = useMemo(() => collectOpenTrades(days), [days]);

  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);

  // Stable, sorted symbol list so the fetch effect only re-runs on real change.
  const symbolsKey = useMemo(
    () => Array.from(new Set(openTrades.map((o) => o.trade.symbol))).sort().join(','),
    [openTrades]
  );

  const fetchQuotes = useCallback(async () => {
    const symbols = symbolsKey ? symbolsKey.split(',') : [];
    if (symbols.length === 0) {
      setPrices({});
      return;
    }
    const quotes = await getStockQuotes(symbols).catch(() => []);
    const map: Record<string, number> = {};
    for (const quote of quotes) map[quote.symbol] = quote.currentPrice;
    setPrices(map);
  }, [symbolsKey]);

  // Initial load + whenever the set of open symbols changes.
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchQuotes().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fetchQuotes]);

  // Refresh when the screen regains focus.
  useFocusEffect(
    useCallback(() => {
      fetchQuotes();
    }, [fetchQuotes])
  );

  // Refresh when the app returns to the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') fetchQuotes();
    });
    return () => subscription.remove();
  }, [fetchQuotes]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchQuotes();
    setRefreshing(false);
  }, [fetchQuotes]);

  const positions = useMemo(() => buildOpenPositions(openTrades, prices), [openTrades, prices]);

  const summary = useMemo(
    () => summarizeAccount({ initialCapital, leverage, accountCurrency }, realizedPnl, positions),
    [initialCapital, leverage, accountCurrency, realizedPnl, positions]
  );

  const closePosition = useCallback(
    async (position: OpenPosition) => {
      setClosingId(position.trade.id);
      try {
        // Always close at the freshest available market price.
        const [quote] = await getStockQuotes([position.trade.symbol]).catch(() => []);
        const exitPrice = quote?.currentPrice ?? position.currentPrice;
        if (exitPrice === null || exitPrice === undefined) return; // can't close unquoted
        updateTrade(position.date, position.trade.id, {
          status: 'closed',
          exitPrice,
          closedAt: Date.now(),
        });
      } finally {
        setClosingId(null);
        fetchQuotes();
      }
    },
    [updateTrade, fetchQuotes]
  );

  return { positions, summary, loading, refreshing, refresh, closingId, closePosition };
}
