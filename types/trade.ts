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
}
