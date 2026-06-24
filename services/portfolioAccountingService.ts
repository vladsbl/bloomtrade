import { AccountSummary, OpenPosition, TradingAccountSettings } from '../types/account';
import { JournalDay } from '../types/journal';
import { Trade } from '../types/trade';

// Leverage presets offered in Settings and applied to new positions.
export const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20, 50, 100];

/** A trade paired with the journal day key it belongs to. */
export interface DatedTrade {
  trade: Trade;
  date: string;
}

const directionSign = (trade: Trade): number => (trade.direction === 'SHORT' ? -1 : 1);

/** Notional position value (exposure), independent of leverage. */
export function positionNotional(entryPrice: number, quantity: number): number {
  return Math.abs((entryPrice || 0) * (quantity || 0));
}

/** Margin (capital locked) for a notional at a given leverage. */
export function positionMargin(notional: number, leverage: number): number {
  const safeLeverage = leverage && leverage > 0 ? leverage : 1;
  return notional / safeLeverage;
}

/**
 * Realized PnL of a single trade. Closed only:
 *   LONG  → (exit - entry) * quantity
 *   SHORT → (entry - exit) * quantity
 */
export function realizedPnlOf(trade: Trade): number {
  if (trade.status !== 'closed' || trade.exitPrice === undefined) return 0;
  return (trade.exitPrice - trade.entryPrice) * trade.quantity * directionSign(trade);
}

/**
 * Unrealized PnL of an open trade at a live price:
 *   LONG  → (current - entry) * quantity
 *   SHORT → (entry - current) * quantity
 */
export function unrealizedPnlOf(trade: Trade, currentPrice: number): number {
  return (currentPrice - trade.entryPrice) * trade.quantity * directionSign(trade);
}

/** Sum of realized PnL across every closed trade in the journal. */
export function accountRealizedPnl(days: Record<string, JournalDay>): number {
  let total = 0;
  for (const day of Object.values(days)) {
    if (!day?.trades) continue;
    for (const trade of day.trades) total += realizedPnlOf(trade);
  }
  return total;
}

/** All currently open trades, paired with their day key (newest first). */
export function collectOpenTrades(days: Record<string, JournalDay>): DatedTrade[] {
  const open: DatedTrade[] = [];
  for (const day of Object.values(days)) {
    if (!day?.trades) continue;
    for (const trade of day.trades) {
      if (trade.status === 'open') open.push({ trade, date: day.date });
    }
  }
  return open.sort((a, b) => openedAtOf(b.trade) - openedAtOf(a.trade));
}

function openedAtOf(trade: Trade): number {
  if (Number.isFinite(trade.openedAt)) return trade.openedAt as number;
  const fromId = Number(trade.id);
  return Number.isFinite(fromId) ? fromId : 0;
}

/** Value one open trade against a live price (or null when unquoted). */
export function buildOpenPosition(dated: DatedTrade, currentPrice: number | null): OpenPosition {
  const { trade, date } = dated;
  const leverage = trade.leverageUsed && trade.leverageUsed > 0 ? trade.leverageUsed : 1;
  const notional = positionNotional(trade.entryPrice, trade.quantity);
  const margin = positionMargin(notional, leverage);

  const hasPrice = currentPrice !== null && Number.isFinite(currentPrice);
  const unrealizedPnl = hasPrice ? unrealizedPnlOf(trade, currentPrice as number) : 0;

  return {
    trade,
    date,
    currentPrice: hasPrice ? (currentPrice as number) : null,
    hasPrice,
    notional,
    leverage,
    margin,
    unrealizedPnl,
    unrealizedPnlPercent: hasPrice && margin > 0 ? (unrealizedPnl / margin) * 100 : 0,
  };
}

/** Value every open trade using a symbol → live price map. */
export function buildOpenPositions(
  openTrades: DatedTrade[],
  priceBySymbol: Record<string, number>
): OpenPosition[] {
  return openTrades.map((dated) => {
    const price = priceBySymbol[dated.trade.symbol];
    return buildOpenPosition(dated, price === undefined ? null : price);
  });
}

/**
 * Roll open positions + realized PnL into the account dashboard figures.
 *
 *   investedCapital  = Σ notional
 *   marginUsed       = Σ margin
 *   unrealizedPnl    = Σ position PnL (priced positions only)
 *   currentCapital   = initialCapital + realizedPnl + unrealizedPnl   (equity)
 *   availableCapital = currentCapital - marginUsed
 *   totalReturn %    = (realizedPnl + unrealizedPnl) / initialCapital * 100
 */
export function summarizeAccount(
  settings: TradingAccountSettings,
  realizedPnl: number,
  positions: OpenPosition[]
): AccountSummary {
  let investedCapital = 0;
  let marginUsed = 0;
  let unrealizedPnl = 0;
  let pricedPositionsCount = 0;

  for (const position of positions) {
    investedCapital += position.notional;
    marginUsed += position.margin;
    if (position.hasPrice) {
      unrealizedPnl += position.unrealizedPnl;
      pricedPositionsCount += 1;
    }
  }

  const initialCapital = settings.initialCapital;
  const currentCapital = initialCapital + realizedPnl + unrealizedPnl;

  return {
    initialCapital,
    realizedPnl,
    unrealizedPnl,
    currentCapital,
    investedCapital,
    marginUsed,
    availableCapital: currentCapital - marginUsed,
    totalReturnPercent: initialCapital > 0 ? ((realizedPnl + unrealizedPnl) / initialCapital) * 100 : 0,
    openPositionsCount: positions.length,
    pricedPositionsCount,
    unpricedPositionsCount: positions.length - pricedPositionsCount,
  };
}
