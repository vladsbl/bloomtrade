import { getStockQuotes } from './financeApi';
import { resolveAsset } from './assetRegistry';
import { MarketOverviewItem } from '../types/market';

// UI symbols only — names, API symbols and data sources are resolved through the registry.
const MARKET_OVERVIEW_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'BTC', 'ETH', 'XAUUSD', 'XAUEUR'];

export async function getMarketOverview(): Promise<MarketOverviewItem[]> {
  const quotes = await getStockQuotes(MARKET_OVERVIEW_SYMBOLS);
  const quoteBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));

  // Always return every item so the UI can render a "Data unavailable" state
  // rather than silently dropping an index/asset.
  return MARKET_OVERVIEW_SYMBOLS.map((symbol) => {
    const quote = quoteBySymbol.get(symbol);
    return {
      symbol,
      displayName: resolveAsset(symbol).name,
      price: quote?.currentPrice ?? null,
      changePercent: quote?.percentChange ?? null,
    };
  });
}
