export type AssetType = 'stock' | 'crypto' | 'index' | 'commodity';

export interface Asset {
  symbol: string; // displayed in the UI, e.g. "BTC"
  apiSymbol: string; // used for API requests, e.g. "BINANCE:BTCUSDT"
  name: string;
  type: AssetType;
}
