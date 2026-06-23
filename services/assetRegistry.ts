import { Asset } from '../types/asset';
import { Currency } from '../types/currency';

// Single source of truth mapping UI symbols to their upstream API symbols.
// Stocks/ETFs use Finnhub; crypto and commodities use Binance's public API
// (Finnhub's free tier returns "no access" for crypto/forex). Add any future
// asset here — the rest of the app resolves through this registry.
const ASSETS: Asset[] = [
  // Indices (ETF proxies — Finnhub has no raw index tickers on the free tier)
  { symbol: 'SPY', apiSymbol: 'SPY', name: 'S&P 500', type: 'index', source: 'finnhub' },
  { symbol: 'QQQ', apiSymbol: 'QQQ', name: 'Nasdaq', type: 'index', source: 'finnhub' },
  { symbol: 'DIA', apiSymbol: 'DIA', name: 'Dow Jones', type: 'index', source: 'finnhub' },

  // Crypto (Binance spot pairs)
  { symbol: 'BTC', apiSymbol: 'BTCUSDT', name: 'Bitcoin', type: 'crypto', source: 'binance' },
  { symbol: 'BTCEUR', apiSymbol: 'BTCEUR', name: 'Bitcoin EUR', type: 'crypto', source: 'binance', quoteCurrency: 'EUR', pinnedCurrency: true },
  { symbol: 'ETH', apiSymbol: 'ETHUSDT', name: 'Ethereum', type: 'crypto', source: 'binance' },

  // Commodities — PAX Gold (1 PAXG = 1 fine troy ounce) tracks spot gold in USD
  { symbol: 'XAUUSD', apiSymbol: 'PAXGUSDT', name: 'Gold', type: 'commodity', source: 'binance', quoteCurrency: 'USD', pinnedCurrency: true },

  // Forex (Binance USDT-quoted pairs used as USD proxies)
  { symbol: 'EURUSD', apiSymbol: 'EURUSDT', name: 'Euro / US Dollar', type: 'forex', source: 'binance', quoteCurrency: 'USD', pinnedCurrency: true },

  // Synthetic assets — derived from other registry entries above,
  // see services/syntheticAssets.ts
  { symbol: 'XAUEUR', apiSymbol: 'XAUEUR', name: 'Gold (EUR)', type: 'commodity', source: 'synthetic', quoteCurrency: 'EUR', pinnedCurrency: true },

  // Stocks
  { symbol: 'AAPL', apiSymbol: 'AAPL', name: 'Apple', type: 'stock', source: 'finnhub' },
  { symbol: 'MSFT', apiSymbol: 'MSFT', name: 'Microsoft', type: 'stock', source: 'finnhub' },
  { symbol: 'NVDA', apiSymbol: 'NVDA', name: 'NVIDIA', type: 'stock', source: 'finnhub' },
  { symbol: 'TSLA', apiSymbol: 'TSLA', name: 'Tesla', type: 'stock', source: 'finnhub' },
  { symbol: 'AMZN', apiSymbol: 'AMZN', name: 'Amazon', type: 'stock', source: 'finnhub' },
  { symbol: 'GOOGL', apiSymbol: 'GOOGL', name: 'Alphabet', type: 'stock', source: 'finnhub' },
  { symbol: 'META', apiSymbol: 'META', name: 'Meta', type: 'stock', source: 'finnhub' },
  { symbol: 'AMD', apiSymbol: 'AMD', name: 'AMD', type: 'stock', source: 'finnhub' },
  { symbol: 'NFLX', apiSymbol: 'NFLX', name: 'Netflix', type: 'stock', source: 'finnhub' },
  { symbol: 'INTC', apiSymbol: 'INTC', name: 'Intel', type: 'stock', source: 'finnhub' },
];

const BY_SYMBOL = new Map(ASSETS.map((asset) => [asset.symbol, asset]));
const BY_API_SYMBOL = new Map(ASSETS.map((asset) => [asset.apiSymbol, asset]));

/**
 * Resolve any UI symbol (or unknown ticker) into an Asset.
 * Unknown symbols fall back to a Finnhub stock where apiSymbol === symbol,
 * so user-added tickers keep working without registry entries.
 */
export function resolveAsset(symbol: string): Asset {
  const upper = symbol.trim().toUpperCase();
  const known = BY_SYMBOL.get(upper) ?? BY_API_SYMBOL.get(symbol.trim());
  return known ?? { symbol: upper, apiSymbol: upper, name: upper, type: 'stock', source: 'finnhub' };
}

/** UI symbol -> API symbol used for the asset's data source. */
export function toApiSymbol(symbol: string): string {
  return resolveAsset(symbol).apiSymbol;
}

/** API symbol (or already-UI symbol) -> canonical UI symbol. */
export function toUiSymbol(symbol: string): string {
  return resolveAsset(symbol).symbol;
}

/** All registered assets — used by the asset search. */
export function getAllAssets(): Asset[] {
  return [...ASSETS];
}

export interface AssetCurrencyInfo {
  native: Currency; // currency the stored/feed value is expressed in
  pinned: boolean; // exempt from the global $/€ display toggle
}

/**
 * Currency metadata for an asset. Unknown/most assets are quoted in USD and
 * follow the global toggle; currency-named pairs (XAUEUR, XAUUSD, …) are pinned
 * to their own currency.
 */
export function getAssetCurrency(symbol: string): AssetCurrencyInfo {
  const asset = resolveAsset(symbol);
  return {
    native: asset.quoteCurrency ?? 'USD',
    pinned: asset.pinnedCurrency ?? false,
  };
}
