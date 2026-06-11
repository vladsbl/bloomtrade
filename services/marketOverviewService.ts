import { getStockQuotes } from './financeApi';
import { MarketOverviewItem } from '../types/market';

interface MarketOverviewDefinition {
  symbol: string;
  displayName: string;
}

// ETF proxies are used for indices since Finnhub's free tier does not expose raw index tickers.
const MARKET_OVERVIEW_DEFINITIONS: MarketOverviewDefinition[] = [
  { symbol: 'SPY', displayName: 'S&P 500' },
  { symbol: 'QQQ', displayName: 'Nasdaq' },
  { symbol: 'DIA', displayName: 'Dow Jones' },
  { symbol: 'BTC', displayName: 'Bitcoin' },
  { symbol: 'ETH', displayName: 'Ethereum' },
];

export async function getMarketOverview(): Promise<MarketOverviewItem[]> {
  const symbols = MARKET_OVERVIEW_DEFINITIONS.map((definition) => definition.symbol);
  const quotes = await getStockQuotes(symbols);
  const quoteBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));

  return MARKET_OVERVIEW_DEFINITIONS.reduce<MarketOverviewItem[]>((items, definition) => {
    const quote = quoteBySymbol.get(definition.symbol);
    if (!quote) return items;

    items.push({
      symbol: definition.symbol,
      displayName: definition.displayName,
      price: quote.currentPrice,
      changePercent: quote.percentChange,
    });
    return items;
  }, []);
}
