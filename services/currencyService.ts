import { getAssetCurrency } from './assetRegistry';
import { getStockQuote } from './financeApi';
import { Currency, CURRENCY_SYMBOLS } from '../types/currency';

// EUR→USD (USD per 1 EUR) used until the live rate loads, or if it fails.
// Conversions only matter in EUR display mode, so this is just a sane default.
export const FALLBACK_EUR_USD = 1.08;

/** Live EUR→USD rate (USD per 1 EUR), read from the EURUSD pair. */
export async function fetchEurUsdRate(): Promise<number> {
  const quote = await getStockQuote('EURUSD');
  if (!Number.isFinite(quote.currentPrice) || quote.currentPrice <= 0) {
    throw new Error('invalid EURUSD rate');
  }
  return quote.currentPrice;
}

/** Convert an amount between USD and EUR given the EUR→USD rate. */
export function convertAmount(value: number, from: Currency, to: Currency, eurUsd: number): number {
  if (from === to) return value;
  const usd = from === 'EUR' ? value * eurUsd : value; // normalize to USD
  return to === 'EUR' ? usd / eurUsd : usd;
}

/** The currency an asset's values are shown in, honoring the pinned exemption. */
export function assetDisplayCurrency(symbol: string, display: Currency): Currency {
  const info = getAssetCurrency(symbol);
  return info.pinned ? info.native : display;
}

export function currencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency];
}

/**
 * Format a number for money display. `compact` drops decimals for values
 * ≥ 1000 (e.g. crypto), otherwise two decimals are always shown.
 */
export function formatNumber(value: number, compact: boolean): string {
  return compact && Math.abs(value) >= 1000
    ? value.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
