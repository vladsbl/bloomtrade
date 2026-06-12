import { getStockQuotes } from './financeApi';
import { resolveAsset } from './assetRegistry';
import { JournalDay } from '../types/journal';
import { Position, PortfolioSummary } from '../types/portfolio';

// A position is fully closed/netted out once its signed quantity is below this.
const QTY_EPSILON = 1e-9;

interface RawPosition {
  asset: string;
  signedQty: number; // LONG adds, SHORT subtracts
  absQty: number; // total traded quantity, for the weighted-average entry
  costSum: number; // Σ entryPrice * qty
  latestDate: string;
}

/**
 * Aggregate trades with status "open" into one position per asset:
 * net signed quantity, weighted-average entry price, and the latest trade date.
 * Closed trades don't contribute to open positions — see calculateRealizedPnl.
 */
function aggregateOpenTrades(days: Record<string, JournalDay>): RawPosition[] {
  const bySymbol = new Map<string, RawPosition>();

  for (const day of Object.values(days)) {
    for (const trade of day.trades) {
      if (trade.status !== 'open') continue;

      const asset = trade.symbol.toUpperCase();
      const sign = trade.direction === 'LONG' ? 1 : -1;

      const existing =
        bySymbol.get(asset) ??
        ({ asset, signedQty: 0, absQty: 0, costSum: 0, latestDate: day.date } as RawPosition);

      existing.signedQty += sign * trade.quantity;
      existing.absQty += trade.quantity;
      existing.costSum += trade.entryPrice * trade.quantity;
      if (day.date > existing.latestDate) existing.latestDate = day.date;

      bySymbol.set(asset, existing);
    }
  }

  return Array.from(bySymbol.values()).filter((raw) => Math.abs(raw.signedQty) > QTY_EPSILON);
}

/** Sum the realized P&L of every closed trade across the journal. */
function calculateRealizedPnl(days: Record<string, JournalDay>): number {
  let total = 0;

  for (const day of Object.values(days)) {
    for (const trade of day.trades) {
      if (trade.status !== 'closed' || trade.exitPrice === undefined) continue;
      const sign = trade.direction === 'LONG' ? 1 : -1;
      total += (trade.exitPrice - trade.entryPrice) * trade.quantity * sign;
    }
  }

  return total;
}

/**
 * Build the live portfolio from the trading journal: derives positions, fetches
 * current prices in parallel, and computes per-position and total P&L.
 */
export async function getPortfolio(days: Record<string, JournalDay>): Promise<PortfolioSummary> {
  const rawPositions = aggregateOpenTrades(days);

  const quotes = await getStockQuotes(rawPositions.map((raw) => raw.asset));
  const priceBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote.currentPrice]));

  const positions: Position[] = rawPositions.map((raw) => {
    const asset = resolveAsset(raw.asset);
    const entryPrice = raw.absQty > 0 ? raw.costSum / raw.absQty : 0;
    const currentPrice = priceBySymbol.get(raw.asset) ?? null;
    const costBasis = entryPrice * Math.abs(raw.signedQty);

    if (currentPrice === null) {
      return {
        asset: raw.asset,
        apiSymbol: asset.apiSymbol,
        name: asset.name,
        quantity: raw.signedQty,
        entryPrice,
        currentPrice: null,
        marketValue: 0,
        unrealizedPnl: 0,
        unrealizedPnlPercent: 0,
        date: raw.latestDate,
      };
    }

    const unrealizedPnl = (currentPrice - entryPrice) * raw.signedQty;

    return {
      asset: raw.asset,
      apiSymbol: asset.apiSymbol,
      name: asset.name,
      quantity: raw.signedQty,
      entryPrice,
      currentPrice,
      marketValue: currentPrice * Math.abs(raw.signedQty),
      unrealizedPnl,
      unrealizedPnlPercent: costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0,
      date: raw.latestDate,
    };
  });

  positions.sort((a, b) => b.marketValue - a.marketValue);

  let totalValue = 0;
  let totalCost = 0;
  let totalUnrealizedPnl = 0;
  for (const position of positions) {
    if (position.currentPrice === null) continue;
    totalValue += position.marketValue;
    totalCost += position.entryPrice * Math.abs(position.quantity);
    totalUnrealizedPnl += position.unrealizedPnl;
  }

  return {
    positions,
    totalValue,
    totalCost,
    totalUnrealizedPnl,
    totalUnrealizedPnlPercent: totalCost > 0 ? (totalUnrealizedPnl / totalCost) * 100 : 0,
    totalRealizedPnl: calculateRealizedPnl(days),
  };
}
