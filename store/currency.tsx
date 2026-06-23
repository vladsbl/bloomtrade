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
import { getAssetCurrency } from '../services/assetRegistry';
import {
  assetDisplayCurrency,
  convertAmount,
  currencySymbol,
  FALLBACK_EUR_USD,
  fetchEurUsdRate,
  formatNumber,
} from '../services/currencyService';
import { Currency } from '../types/currency';

const STORAGE_KEY = '@market_journal/currency';

interface FormatOptions {
  withSymbol?: boolean; // prepend the currency symbol (default true)
  compact?: boolean; // drop decimals for values ≥ 1000 (default true)
}

interface CurrencyContextValue {
  currency: Currency; // global display currency
  setCurrency: (currency: Currency) => void;
  eurUsd: number; // live EUR→USD rate (USD per 1 EUR)
  currencySymbol: string; // symbol of the global display currency
  /** Display currency actually used for an asset (pinned assets keep their own). */
  currencyForAsset: (symbol: string) => Currency;
  symbolForAsset: (symbol: string) => string;
  /** Native asset value → number in the asset's display currency (no symbol). */
  convert: (value: number, symbol: string) => number;
  /** A value typed in the asset's display currency → native value, for storage. */
  toNative: (value: number, symbol: string) => number;
  /** Native asset value → formatted string in the asset's display currency. */
  formatPrice: (value: number, symbol: string, options?: FormatOptions) => string;
  /** USD-denominated aggregate (totals, P&L) → formatted string in display currency. */
  formatBase: (value: number, options?: FormatOptions) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [eurUsd, setEurUsd] = useState<number>(FALLBACK_EUR_USD);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'USD' || stored === 'EUR') setCurrencyState(stored);
    });
  }, []);

  // Load the live rate once on mount; keep the fallback if it fails.
  useEffect(() => {
    let active = true;
    fetchEurUsdRate()
      .then((rate) => active && setEurUsd(rate))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<CurrencyContextValue>(() => {
    const currencyForAsset = (symbol: string) => assetDisplayCurrency(symbol, currency);

    const convert = (amount: number, symbol: string) => {
      const native = getAssetCurrency(symbol).native;
      return convertAmount(amount, native, currencyForAsset(symbol), eurUsd);
    };

    const toNative = (amount: number, symbol: string) => {
      const native = getAssetCurrency(symbol).native;
      return convertAmount(amount, currencyForAsset(symbol), native, eurUsd);
    };

    const format = (amount: number, target: Currency, options?: FormatOptions) => {
      const withSymbol = options?.withSymbol ?? true;
      const compact = options?.compact ?? true;
      const body = formatNumber(amount, compact);
      return withSymbol ? `${currencySymbol(target)}${body}` : body;
    };

    return {
      currency,
      setCurrency,
      eurUsd,
      currencySymbol: currencySymbol(currency),
      currencyForAsset,
      symbolForAsset: (symbol: string) => currencySymbol(currencyForAsset(symbol)),
      convert,
      toNative,
      formatPrice: (amount, symbol, options) =>
        format(convert(amount, symbol), currencyForAsset(symbol), options),
      formatBase: (amount, options) =>
        format(convertAmount(amount, 'USD', currency, eurUsd), currency, options),
    };
  }, [currency, eurUsd, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
}
