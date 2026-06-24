import { Currency } from './currency';
import { Trade } from './trade';

// Persisted trading-account configuration (see store/tradingAccount.tsx).
export interface TradingAccountSettings {
  initialCapital: number; // starting capital, in accountCurrency
  leverage: number; // default leverage applied to new positions (x1..x100)
  accountCurrency: Currency;
}

// A single open trade enriched with live valuation (see portfolioAccountingService).
export interface OpenPosition {
  trade: Trade;
  date: string; // journal day key the trade lives under (needed to close it)
  currentPrice: number | null; // live price, null when the asset isn't quoted
  hasPrice: boolean;
  notional: number; // |entryPrice * quantity| — position value / exposure
  leverage: number; // leverageUsed ?? 1
  margin: number; // notional / leverage — capital locked
  unrealizedPnl: number; // 0 when currentPrice is null
  unrealizedPnlPercent: number; // return on margin (leverage-aware), %
}

// Aggregate account state shown in the dashboard.
export interface AccountSummary {
  initialCapital: number;
  realizedPnl: number; // from closed trades
  unrealizedPnl: number; // from open positions
  currentCapital: number; // equity = initial + realized + unrealized
  investedCapital: number; // Σ notional of open positions
  marginUsed: number; // Σ margin of open positions
  availableCapital: number; // currentCapital - marginUsed
  totalReturnPercent: number; // (realized + unrealized) / initial * 100
  openPositionsCount: number;
  pricedPositionsCount: number;
  unpricedPositionsCount: number;
}
