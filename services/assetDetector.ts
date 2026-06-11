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

export function detectAsset(text: string): string | undefined {
  const lower = text.toLowerCase();

  for (const [symbol, keywords] of Object.entries(ASSET_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return symbol;
    }
  }

  return undefined;
}
