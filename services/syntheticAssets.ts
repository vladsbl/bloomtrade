import { StockQuote } from '../types/quote';

interface SyntheticDefinition {
  base: string; // UI symbol of the numerator asset
  quote: string; // UI symbol of the denominator asset
}

// Synthetic assets are computed as base / quote from two underlying quotes,
// e.g. XAUEUR = XAUUSD / EURUSD.
const SYNTHETIC_DEFINITIONS: Record<string, SyntheticDefinition> = {
  XAUEUR: { base: 'XAUUSD', quote: 'EURUSD' },
};

/**
 * Compute a synthetic quote as base/quote. getQuote fetches the underlying
 * quotes (by UI symbol); if either leg is unavailable this throws, so the
 * caller surfaces "Data unavailable" instead of an incorrect value.
 *
 * High/low/open are derived the same way as a simple approximation — they
 * are not the true intraday high/low of the ratio, just enough to render
 * the synthetic asset like a normal one.
 */
export async function computeSyntheticQuote(
  symbol: string,
  getQuote: (uiSymbol: string) => Promise<StockQuote>
): Promise<StockQuote> {
  const definition = SYNTHETIC_DEFINITIONS[symbol];
  if (!definition) {
    throw new Error(`No synthetic definition for ${symbol}.`);
  }

  const [base, quote] = await Promise.all([
    getQuote(definition.base),
    getQuote(definition.quote),
  ]);

  if (!quote.currentPrice || !quote.previousClose || !quote.high || !quote.low || !quote.open) {
    throw new Error(`Cannot compute ${symbol}: ${definition.quote} quote is invalid.`);
  }

  const currentPrice = base.currentPrice / quote.currentPrice;
  const previousClose = base.previousClose / quote.previousClose;

  return {
    symbol,
    currentPrice,
    previousClose,
    change: currentPrice - previousClose,
    percentChange: ((currentPrice - previousClose) / previousClose) * 100,
    high: base.high / quote.high,
    low: base.low / quote.low,
    open: base.open / quote.open,
  };
}
