import { getStockQuotes } from './financeApi';
import { resolveAsset } from './assetRegistry';
import { MarketOverviewItem } from '../types/market';

// UI symbols only — names and API symbols are resolved through the asset registry.
const MARKET_OVERVIEW_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'BTC', 'ETH'];

export async function getMarketOverview(): Promise<MarketOverviewItem[]> {
  const quotes = await getStockQuotes(MARKET_OVERVIEW_SYMBOLS);
  const quoteBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));

  return MARKET_OVERVIEW_SYMBOLS.reduce<MarketOverviewItem[]>((items, symbol) => {
    const quote = quoteBySymbol.get(symbol);
    if (!quote) return items;

    items.push({
      symbol,
      displayName: resolveAsset(symbol).name,
      price: quote.currentPrice,
      changePercent: quote.percentChange,
    });
    return items;
  }, []);
}
