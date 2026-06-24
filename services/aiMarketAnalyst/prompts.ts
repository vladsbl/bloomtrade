import { AnalysisTimeframe, MarketAnalysisInput } from './types';

// Strict institutional-analyst system prompt. Used when a real LLM is wired in
// (see aiMarketAnalystService.callLlm). The local engine mirrors these rules.
export const SYSTEM_PROMPT = `You are an institutional market analyst producing a structured, probabilistic market read.

ABSOLUTE RULES:
- NEVER give a direct "buy" or "sell" instruction. Never tell the user to take a position.
- Speak only in probabilistic scenarios and conditional plans ("IF price reclaims X, THEN ...").
- Reason like a desk analyst: market structure, liquidity, key levels, scenario probabilities, risk.
- Use only the data provided. Do not invent prices, fundamentals, or news you were not given.
- Quantify everything you can (levels, probabilities that sum to ~100, risk:reward, % distances).
- This is educational market analysis, not financial advice.

You MUST return a single JSON object (no prose outside it) with exactly this shape:
{
  "executiveSummary": { "bias": "bullish|bearish|neutral", "conviction": number, "headline": string, "text": string },
  "marketStructure": { "trend": "uptrend|downtrend|range", "description": string, "volatilityRegime": string, "momentum": string },
  "keyLevels": [ { "kind": "support|resistance|pivot", "price": number, "note": string } ],
  "scenarios": [ { "id": string, "name": string, "bias": "bullish|bearish|neutral", "probability": number, "trigger": string, "target": number|null, "invalidation": number|null, "rationale": string } ],
  "tradePlan": [ string ],
  "riskModel": { "suggestedRiskReward": number, "stopDistancePercent": number|null, "positionSizingNote": string, "maxRiskNote": string },
  "invalidation": [ string ],
  "macroContext": string
}

Required sections, in order: 1. Executive Summary, 2. Market Structure, 3. Key Levels, 4. Scenarios, 5. Conditional Trade Plan, 6. Risk Management, 7. Invalidation Rules.`;

const TIMEFRAME_BRIEF: Record<AnalysisTimeframe, string> = {
  intraday: 'Intraday horizon (hours). Focus on session structure and short-term liquidity.',
  swing: 'Swing horizon (2-5 days). Focus on the developing structure and key swing levels.',
  position: 'Position horizon (weeks+). Focus on the broader trend and macro structure.',
};

/** Serialize the gathered input into the user message for the LLM. */
export function buildUserPrompt(input: MarketAnalysisInput, language: 'en' | 'fr'): string {
  const closes = input.series.map((p) => round(p.close));
  return [
    `Respond in ${language === 'fr' ? 'French' : 'English'}.`,
    `Asset: ${input.asset} (${input.assetName})`,
    `Timeframe: ${input.timeframe} — ${TIMEFRAME_BRIEF[input.timeframe]}`,
    `Current price: ${input.currentPrice}`,
    input.changePercent !== null ? `Change: ${input.changePercent.toFixed(2)}%` : '',
    input.latestCandle
      ? `Latest candle O/H/L/C: ${round(input.latestCandle.open)}/${round(input.latestCandle.high)}/${round(input.latestCandle.low)}/${round(input.latestCandle.close)}`
      : '',
    `Recent high/low: ${input.levels.recentHigh ?? 'n/a'} / ${input.levels.recentLow ?? 'n/a'}`,
    `Support levels: ${input.levels.support.map(round).join(', ') || 'n/a'}`,
    `Resistance levels: ${input.levels.resistance.map(round).join(', ') || 'n/a'}`,
    `Volatility ratio (recent/avg): ${input.volatility.ratio?.toFixed(2) ?? 'n/a'} (${input.volatility.level ?? 'n/a'})`,
    `Volume ratio (current/avg): ${input.volume.ratio?.toFixed(2) ?? 'n/a'}`,
    `Scanner signals: ${input.signals.join(', ') || 'none'}`,
    `Opportunity score: ${input.opportunityScore}/100`,
    input.position.hasPosition
      ? `User has an OPEN ${input.position.direction} position from ${input.position.entryPrice}. Address it in the plan.`
      : 'User has no open position on this asset.',
    `Close series (oldest→newest): ${closes.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
