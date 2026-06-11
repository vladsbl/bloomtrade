import { Asset } from '../types/asset';

// Single source of truth mapping UI symbols to their Finnhub API symbols.
// Add any future asset here — the rest of the app resolves through this registry.
const ASSETS: Asset[] = [
  // Indices (ETF proxies — Finnhub's free tier has no raw index tickers)
  { symbol: 'SPY', apiSymbol: 'SPY', name: 'S&P 500', type: 'index' },
  { symbol: 'QQQ', apiSymbol: 'QQQ', name: 'Nasdaq', type: 'index' },
  { symbol: 'DIA', apiSymbol: 'DIA', name: 'Dow Jones', type: 'index' },

  // Crypto
  { symbol: 'BTC', apiSymbol: 'BINANCE:BTCUSDT', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETH', apiSymbol: 'BINANCE:ETHUSDT', name: 'Ethereum', type: 'crypto' },

  // Stocks
  { symbol: 'AAPL', apiSymbol: 'AAPL', name: 'Apple', type: 'stock' },
  { symbol: 'MSFT', apiSymbol: 'MSFT', name: 'Microsoft', type: 'stock' },
  { symbol: 'NVDA', apiSymbol: 'NVDA', name: 'NVIDIA', type: 'stock' },
  { symbol: 'TSLA', apiSymbol: 'TSLA', name: 'Tesla', type: 'stock' },
  { symbol: 'AMZN', apiSymbol: 'AMZN', name: 'Amazon', type: 'stock' },
  { symbol: 'GOOGL', apiSymbol: 'GOOGL', name: 'Alphabet', type: 'stock' },
  { symbol: 'META', apiSymbol: 'META', name: 'Meta', type: 'stock' },
  { symbol: 'AMD', apiSymbol: 'AMD', name: 'AMD', type: 'stock' },
  { symbol: 'NFLX', apiSymbol: 'NFLX', name: 'Netflix', type: 'stock' },
  { symbol: 'INTC', apiSymbol: 'INTC', name: 'Intel', type: 'stock' },
];

const BY_SYMBOL = new Map(ASSETS.map((asset) => [asset.symbol, asset]));
const BY_API_SYMBOL = new Map(ASSETS.map((asset) => [asset.apiSymbol, asset]));

/**
 * Resolve any UI symbol (or unknown ticker) into an Asset.
 * Unknown symbols fall back to a plain stock where apiSymbol === symbol,
 * so user-added tickers keep working without registry entries.
 */
export function resolveAsset(symbol: string): Asset {
  const upper = symbol.trim().toUpperCase();
  const known = BY_SYMBOL.get(upper) ?? BY_API_SYMBOL.get(symbol.trim());
  return known ?? { symbol: upper, apiSymbol: upper, name: upper, type: 'stock' };
}

/** UI symbol -> API symbol used for Finnhub requests. */
export function toApiSymbol(symbol: string): string {
  return resolveAsset(symbol).apiSymbol;
}

/** API symbol (or already-UI symbol) -> canonical UI symbol. */
export function toUiSymbol(symbol: string): string {
  return resolveAsset(symbol).symbol;
}
