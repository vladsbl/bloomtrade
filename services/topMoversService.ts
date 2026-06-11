import { getStockQuotes } from './financeApi';
import { TopMoverItem, TopMoversData } from '../types/market';

const MAX_MOVERS = 3;

// Finnhub's free tier has no dedicated "top movers" endpoint, so gainers/losers are
// derived from this basket of liquid symbols. Swap this for a screener API later
// without changing the TopMoversData shape consumed by the UI.
const TOP_MOVERS_UNIVERSE = [
  'AAPL',
  'MSFT',
  'NVDA',
  'TSLA',
  'AMZN',
  'GOOGL',
  'META',
  'AMD',
  'NFLX',
  'INTC',
];

export async function getTopMovers(): Promise<TopMoversData> {
  const quotes = await getStockQuotes(TOP_MOVERS_UNIVERSE);

  const movers: TopMoverItem[] = quotes
    .map((quote) => ({ symbol: quote.symbol, changePercent: quote.percentChange }))
    .sort((a, b) => b.changePercent - a.changePercent);

  return {
    gainers: movers.slice(0, MAX_MOVERS),
    losers: movers.slice(-MAX_MOVERS).reverse(),
  };
}
