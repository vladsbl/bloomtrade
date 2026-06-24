import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { accountRealizedPnl } from '../services/portfolioAccountingService';
import { formatNumber } from '../services/currencyService';
import { useJournalByDate } from './journalByDate';
import { Currency, CURRENCY_SYMBOLS } from '../types/currency';

const STORAGE_KEY = '@market_journal/trading_account';

const DEFAULTS = {
  initialCapital: 10000,
  leverage: 1,
  accountCurrency: 'EUR' as Currency,
};

interface MoneyOptions {
  signed?: boolean; // force a leading + on positive values (for P&L)
  compact?: boolean; // drop decimals for values ≥ 1000 (default true)
}

interface TradingAccountContextValue {
  loading: boolean;
  initialCapital: number;
  leverage: number;
  accountCurrency: Currency;
  realizedPnl: number; // derived from closed trades
  currentCapital: number; // settled capital = initialCapital + realizedPnl
  updateCapital: (value: number) => void;
  updateLeverage: (value: number) => void;
  updateAccountCurrency: (currency: Currency) => void;
  /** Format an amount in the account currency, sign-aware. */
  formatMoney: (value: number, options?: MoneyOptions) => string;
}

const TradingAccountContext = createContext<TradingAccountContextValue | undefined>(undefined);

export function TradingAccountProvider({ children }: { children: ReactNode }) {
  const { days } = useJournalByDate();

  const [initialCapital, setInitialCapital] = useState(DEFAULTS.initialCapital);
  const [leverage, setLeverage] = useState(DEFAULTS.leverage);
  const [accountCurrency, setAccountCurrency] = useState<Currency>(DEFAULTS.accountCurrency);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const stored = JSON.parse(raw) as Partial<typeof DEFAULTS>;
        if (Number.isFinite(stored.initialCapital)) setInitialCapital(stored.initialCapital as number);
        if (Number.isFinite(stored.leverage)) setLeverage(stored.leverage as number);
        if (stored.accountCurrency === 'USD' || stored.accountCurrency === 'EUR') {
          setAccountCurrency(stored.accountCurrency);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback(
    (next: { initialCapital: number; leverage: number; accountCurrency: Currency }) => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
    []
  );

  const updateCapital = useCallback(
    (value: number) => {
      const safe = Number.isFinite(value) && value >= 0 ? value : 0;
      setInitialCapital(safe);
      persist({ initialCapital: safe, leverage, accountCurrency });
    },
    [persist, leverage, accountCurrency]
  );

  const updateLeverage = useCallback(
    (value: number) => {
      const safe = Number.isFinite(value) && value > 0 ? value : 1;
      setLeverage(safe);
      persist({ initialCapital, leverage: safe, accountCurrency });
    },
    [persist, initialCapital, accountCurrency]
  );

  const updateAccountCurrency = useCallback(
    (currency: Currency) => {
      setAccountCurrency(currency);
      persist({ initialCapital, leverage, accountCurrency: currency });
    },
    [persist, initialCapital, leverage]
  );

  const realizedPnl = useMemo(() => accountRealizedPnl(days), [days]);

  const value = useMemo<TradingAccountContextValue>(() => {
    const formatMoney = (amount: number, options?: MoneyOptions) => {
      const sign = amount < 0 ? '-' : options?.signed ? '+' : '';
      return `${sign}${CURRENCY_SYMBOLS[accountCurrency]}${formatNumber(Math.abs(amount), options?.compact ?? true)}`;
    };

    return {
      loading,
      initialCapital,
      leverage,
      accountCurrency,
      realizedPnl,
      currentCapital: initialCapital + realizedPnl,
      updateCapital,
      updateLeverage,
      updateAccountCurrency,
      formatMoney,
    };
  }, [
    loading,
    initialCapital,
    leverage,
    accountCurrency,
    realizedPnl,
    updateCapital,
    updateLeverage,
    updateAccountCurrency,
  ]);

  return <TradingAccountContext.Provider value={value}>{children}</TradingAccountContext.Provider>;
}

export function useTradingAccount(): TradingAccountContextValue {
  const ctx = useContext(TradingAccountContext);
  if (!ctx) {
    throw new Error('useTradingAccount must be used within a TradingAccountProvider');
  }
  return ctx;
}
