export type TradeDirection = 'LONG' | 'SHORT';

export interface Trade {
  id: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  date: string;
  notes?: string;
}
