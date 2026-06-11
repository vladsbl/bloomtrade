import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Trade } from '../types/trade';
import { loadTrades, saveTrades } from '../services/journalStorage';

interface JournalContextValue {
  trades: Trade[];
  loading: boolean;
  addTrade: (trade: Omit<Trade, 'id'>) => Promise<void>;
  removeTrade: (id: string) => Promise<void>;
}

const JournalContext = createContext<JournalContextValue | undefined>(undefined);

export function JournalProvider({ children }: { children: ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrades()
      .then(setTrades)
      .finally(() => setLoading(false));
  }, []);

  const addTrade = useCallback(async (trade: Omit<Trade, 'id'>) => {
    setTrades((prev) => {
      const next = [{ ...trade, id: Date.now().toString() }, ...prev];
      saveTrades(next);
      return next;
    });
  }, []);

  const removeTrade = useCallback(async (id: string) => {
    setTrades((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTrades(next);
      return next;
    });
  }, []);

  return (
    <JournalContext.Provider value={{ trades, loading, addTrade, removeTrade }}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal(): JournalContextValue {
  const ctx = useContext(JournalContext);
  if (!ctx) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return ctx;
}
