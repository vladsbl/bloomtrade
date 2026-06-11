import { getAllAssets } from './assetRegistry';
import { Asset } from '../types/asset';

const MAX_RESULTS = 8;

/**
 * Search known assets by name, UI symbol, or API symbol (case-insensitive).
 * Returns an empty list for an empty query. Name/symbol prefix matches rank first
 * so "bit" surfaces Bitcoin before any incidental substring matches.
 */
export function searchAssets(query: string): Asset[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const matches = getAllAssets().filter((asset) => {
    return (
      asset.name.toLowerCase().includes(q) ||
      asset.symbol.toLowerCase().includes(q) ||
      asset.apiSymbol.toLowerCase().includes(q)
    );
  });

  matches.sort((a, b) => rank(a, q) - rank(b, q));
  return matches.slice(0, MAX_RESULTS);
}

function rank(asset: Asset, query: string): number {
  const name = asset.name.toLowerCase();
  const symbol = asset.symbol.toLowerCase();

  if (symbol === query || name === query) return 0;
  if (symbol.startsWith(query) || name.startsWith(query)) return 1;
  return 2;
}
