import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { loadJournalDays, saveJournalDays } from '../services/journalStorage';
import { JournalDay } from '../types/journal';
import { Trade } from '../types/trade';

interface JournalByDateContextValue {
  days: Record<string, JournalDay>;
  loading: boolean;
  getDay: (date: string) => JournalDay;
  addTrade: (date: string, trade: Omit<Trade, 'id'>) => void;
  updateTrade: (date: string, tradeId: string, updates: Partial<Omit<Trade, 'id'>>) => void;
  removeTrade: (date: string, tradeId: string) => void;
  setNote: (date: string, note: string) => void;
}

const JournalByDateContext = createContext<JournalByDateContextValue | undefined>(undefined);

function emptyDay(date: string): JournalDay {
  return { date, trades: [], note: '' };
}

export function JournalByDateProvider({ children }: { children: ReactNode }) {
  const [days, setDays] = useState<Record<string, JournalDay>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJournalDays()
      .then((list) => {
        const map: Record<string, JournalDay> = {};
        for (const day of list) {
          map[day.date] = day;
        }
        setDays(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback((map: Record<string, JournalDay>) => {
    saveJournalDays(Object.values(map));
  }, []);

  const getDay = useCallback((date: string): JournalDay => days[date] ?? emptyDay(date), [days]);

  const addTrade = useCallback(
    (date: string, trade: Omit<Trade, 'id'>) => {
      setDays((prev) => {
        const day = prev[date] ?? emptyDay(date);
        const now = Date.now();
        // Capture leverage/margin context at open time (defaults to x1).
        const leverageUsed = trade.leverageUsed && trade.leverageUsed > 0 ? trade.leverageUsed : 1;
        const positionSize = Math.abs((trade.entryPrice || 0) * (trade.quantity || 0));
        // Stamp openedAt for entry-time analytics; if the trade is logged
        // already closed, stamp closedAt too so it isn't left dangling.
        const created: Trade = {
          ...trade,
          id: now.toString(),
          openedAt: trade.openedAt ?? now,
          closedAt: trade.status === 'closed' ? trade.closedAt ?? now : trade.closedAt,
          leverageUsed,
          positionSize,
          marginUsed: positionSize / leverageUsed,
        };
        const next = {
          ...prev,
          [date]: { ...day, trades: [created, ...day.trades] },
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  // Edit an existing trade in place — e.g. to close an open position later
  // (set status: 'closed' and an exitPrice) without recreating it.
  const updateTrade = useCallback(
    (date: string, tradeId: string, updates: Partial<Omit<Trade, 'id'>>) => {
      setDays((prev) => {
        const day = prev[date];
        if (!day) return prev;
        const next = {
          ...prev,
          [date]: {
            ...day,
            trades: day.trades.map((trade) => {
              if (trade.id !== tradeId) return trade;
              const merged = { ...trade, ...updates };
              // Record the close time on the open → closed transition so the
              // holding duration can be measured.
              if (updates.status === 'closed' && trade.status !== 'closed' && merged.closedAt === undefined) {
                merged.closedAt = Date.now();
              }
              return merged;
            }),
          },
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const removeTrade = useCallback(
    (date: string, tradeId: string) => {
      setDays((prev) => {
        const day = prev[date];
        if (!day) return prev;
        const next = {
          ...prev,
          [date]: {
            ...day,
            trades: day.trades.filter((t) => t.id !== tradeId),
          },
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setNote = useCallback(
    (date: string, note: string) => {
      setDays((prev) => {
        const day = prev[date] ?? emptyDay(date);
        const next = {
          ...prev,
          [date]: { ...day, note },
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return (
    <JournalByDateContext.Provider
      value={{ days, loading, getDay, addTrade, updateTrade, removeTrade, setNote }}
    >
      {children}
    </JournalByDateContext.Provider>
  );
}

export function useJournalByDate(): JournalByDateContextValue {
  const ctx = useContext(JournalByDateContext);
  if (!ctx) {
    throw new Error('useJournalByDate must be used within a JournalByDateProvider');
  }
  return ctx;
}
