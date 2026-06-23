export type TradeDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'open' | 'closed';

export interface Trade {
  id: string;
  symbol: string;
  direction: TradeDirection;
  status: TradeStatus;
  entryPrice: number;
  exitPrice?: number; // only set once the position is closed
  quantity: number;
  notes?: string;
  // Optional timestamps (ms epoch) added for Trading Analytics. Backward
  // compatible: older trades have neither. `openedAt` is backfilled from `id`
  // (which is Date.now() at creation) on load; `closedAt` is set when an open
  // position is later closed, enabling holding-duration analysis.
  openedAt?: number;
  closedAt?: number;
}
