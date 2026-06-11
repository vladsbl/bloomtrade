export type AssetType = 'stock' | 'crypto' | 'index';

export interface Asset {
  symbol: string; // displayed in the UI, e.g. "BTC"
  apiSymbol: string; // used for API requests, e.g. "BINANCE:BTCUSDT"
  name: string;
  type: AssetType;
}
