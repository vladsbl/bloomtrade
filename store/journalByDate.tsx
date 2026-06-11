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
        const next = {
          ...prev,
          [date]: {
            ...day,
            trades: [{ ...trade, id: Date.now().toString() }, ...day.trades],
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
      value={{ days, loading, getDay, addTrade, removeTrade, setNote }}
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
