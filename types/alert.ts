export type AlertCondition = 'above' | 'below';

export interface PriceAlert {
  id: string;
  symbol: string; // UI symbol, e.g. "BTC"
  apiSymbol: string;
  name: string;
  condition: AlertCondition;
  targetPrice: number;
  isActive: boolean;
  createdAt: number;
  triggeredAt?: number;
}
