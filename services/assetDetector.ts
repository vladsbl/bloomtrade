const KNOWN_TICKERS = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'BTC', 'ETH'];

const ASSET_KEYWORDS: Record<string, string[]> = {
  AAPL: ['apple', 'aapl'],
  TSLA: ['tesla', 'tsla'],
  MSFT: ['microsoft', 'msft'],
  GOOGL: ['google', 'alphabet', 'googl'],
  AMZN: ['amazon', 'amzn'],
  NVDA: ['nvidia', 'nvda'],
  META: ['meta', 'facebook'],
  BTC: ['bitcoin', 'btc'],
  ETH: ['ethereum', 'eth'],
};

export function detectAssets(text: string): string[] {
  const found = new Set<string>();

  const uppercaseWords = text.match(/\b[A-Z]{2,5}\b/g) ?? [];
  uppercaseWords.forEach((word) => {
    if (KNOWN_TICKERS.includes(word)) found.add(word);
  });

  const lower = text.toLowerCase();
  for (const [symbol, keywords] of Object.entries(ASSET_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      found.add(symbol);
    }
  }

  return Array.from(found);
}

export function detectAsset(text: string): string | undefined {
  return detectAssets(text)[0];
}
