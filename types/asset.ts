import { Currency } from './currency';

export type AssetType = 'stock' | 'crypto' | 'index' | 'commodity' | 'forex';

// Which upstream API serves quotes for an asset.
// Finnhub's free tier only covers US stocks/ETFs, so crypto and commodities
// are served by Binance's public market-data API. "synthetic" assets are
// derived from other registry entries — see services/syntheticAssets.ts.
export type AssetSource = 'finnhub' | 'binance' | 'synthetic';

export interface Asset {
  symbol: string; // displayed in the UI, e.g. "BTC"
  apiSymbol: string; // used for API requests, e.g. "BTCUSDT" or "AAPL"
  name: string;
  type: AssetType;
  source: AssetSource;
  // Currency the upstream feed prices this asset in. Defaults to USD.
  quoteCurrency?: Currency;
  // When true, the asset is always displayed in quoteCurrency and is exempt
  // from the global $/€ toggle — its symbol already names a currency
  // (e.g. XAUEUR, XAUUSD, BTCEUR, EURUSD).
  pinnedCurrency?: boolean;
}
