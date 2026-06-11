const ASSET_KEYWORDS: Record<string, string> = {
  'apple inc': 'AAPL',
  apple: 'AAPL',
  'iphone maker': 'AAPL',
  iphone: 'AAPL',
  aapl: 'AAPL',
  tesla: 'TSLA',
  tsla: 'TSLA',
  microsoft: 'MSFT',
  msft: 'MSFT',
  nvidia: 'NVDA',
  nvda: 'NVDA',
  google: 'GOOGL',
  alphabet: 'GOOGL',
  googl: 'GOOGL',
  amazon: 'AMZN',
  amzn: 'AMZN',
  meta: 'META',
  facebook: 'META',
  bitcoin: 'BTC',
  btc: 'BTC',
  ethereum: 'ETH',
  eth: 'ETH',
};

export function detectRelatedAssets(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const [keyword, symbol] of Object.entries(ASSET_KEYWORDS)) {
    if (lower.includes(keyword)) {
      found.add(symbol);
    }
  }

  return Array.from(found);
}

export function detectPrimaryAsset(text: string): string | undefined {
  return detectRelatedAssets(text)[0];
}
