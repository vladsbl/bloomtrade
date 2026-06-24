import { resolveAsset } from '../assetRegistry';
import { getStockQuote } from '../financeApi';
import { getHistoricalPrices } from '../historicalPriceService';
import { scanAsset } from '../marketScannerService';
import { collectOpenTrades } from '../portfolioAccountingService';
import { getCachedAnalysis, setCachedAnalysis } from './cache';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import {
  AnalysisTimeframe,
  KeyLevel,
  MarketAnalysisInput,
  MarketAnalysisOutput,
  MarketBias,
  SeriesPoint,
  TradeScenario,
} from './types';
import { JournalDay } from '../../types/journal';
import { HistoryRange } from '../../types/history';
import { TranslationKey } from '../../store/translations';

type Translate = (key: TranslationKey) => string;
type FormatPrice = (value: number) => string;

// Optional real LLM. When EXPO_PUBLIC_ANTHROPIC_API_KEY is set the service calls
// Claude; otherwise it uses the fully-offline local synthesis engine.
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

const TIMEFRAME_RANGE: Record<AnalysisTimeframe, HistoryRange> = {
  intraday: '1D',
  swing: '1M',
  position: '1Y',
};

export interface RunAnalysisParams {
  symbol: string;
  timeframe: AnalysisTimeframe;
  days: Record<string, JournalDay>;
  t: Translate;
  language: 'en' | 'fr';
  formatPrice: FormatPrice;
  force?: boolean;
}

/**
 * Entry point: returns a cached report when fresh, otherwise gathers market
 * data, runs the analysis (LLM when configured, else local), and caches it.
 */
export async function runAnalysis(params: RunAnalysisParams): Promise<MarketAnalysisOutput> {
  const { symbol, timeframe, days, t, language, formatPrice, force } = params;

  if (!force) {
    const cached = await getCachedAnalysis(symbol, timeframe);
    if (cached) return cached;
  }

  const input = await gatherInput(symbol, timeframe, days);
  const llm = await callLlm(input, language).catch(() => null);
  const output = llm ?? synthesizeLocalAnalysis(input, t, formatPrice);

  await setCachedAnalysis(output).catch(() => {});
  return output;
}

// --- Input gathering -------------------------------------------------------

async function gatherInput(
  symbol: string,
  timeframe: AnalysisTimeframe,
  days: Record<string, JournalDay>
): Promise<MarketAnalysisInput> {
  const asset = resolveAsset(symbol);

  const [history, quote, scan] = await Promise.all([
    getHistoricalPrices(symbol, TIMEFRAME_RANGE[timeframe])
      .then((s) => s.points)
      .catch(() => []),
    getStockQuote(symbol).catch(() => null),
    scanAsset(symbol).catch(() => null),
  ]);

  const valid = history.filter((p) => Number.isFinite(p.price) && p.price > 0);
  const series: SeriesPoint[] = valid.map((p) => ({
    time: p.time,
    close: p.price,
    volume: Number.isFinite(p.volume) ? (p.volume as number) : null,
  }));

  const currentPrice = quote?.currentPrice ?? (series.length ? series[series.length - 1].close : 0);
  const last20 = series.slice(-20).map((p) => p.close);
  const recentHigh = last20.length ? Math.max(...last20) : null;
  const recentLow = last20.length ? Math.min(...last20) : null;

  const metrics = scan?.metrics;
  const resistance = uniqueLevels([recentHigh, metrics?.high20 ?? null]);
  const support = uniqueLevels([recentLow, metrics?.low20 ?? null]);

  const volumes = series.map((p) => p.volume).filter((v): v is number => v !== null);
  const currentVolume = series.length ? series[series.length - 1].volume : null;
  const averageVolume = volumes.length >= 5 ? mean(volumes.slice(-21, -1)) : null;

  const open = collectOpenTrades(days).find((o) => o.trade.symbol === symbol);

  return {
    asset: asset.symbol,
    assetName: asset.name,
    timeframe,
    currentPrice,
    changePercent: quote?.percentChange ?? null,
    latestCandle: quote
      ? { open: quote.open, high: quote.high, low: quote.low, close: quote.currentPrice }
      : null,
    series,
    volume: {
      current: currentVolume,
      average: averageVolume,
      ratio: metrics?.volumeRatio ?? null,
    },
    volatility: { ratio: metrics?.volatilityRatio ?? null, level: metrics?.volatilityLevel ?? null },
    levels: { support, resistance, recentHigh, recentLow },
    signals: scan?.signals.map((s) => s.kind) ?? [],
    opportunityScore: scan?.score.score ?? 0,
    position: open
      ? { hasPosition: true, direction: open.trade.direction, entryPrice: open.trade.entryPrice }
      : { hasPosition: false },
    generatedAt: new Date().toISOString(),
  };
}

// --- Local synthesis engine (offline, deterministic) -----------------------

function synthesizeLocalAnalysis(
  input: MarketAnalysisInput,
  t: Translate,
  fmt: FormatPrice
): MarketAnalysisOutput {
  const closes = input.series.map((p) => p.close);
  const n = closes.length;
  const ret20 =
    n > 21 ? (closes[n - 1] / closes[n - 21] - 1) * 100 : n > 1 ? (closes[n - 1] / closes[0] - 1) * 100 : 0;
  const trend: 'uptrend' | 'downtrend' | 'range' = ret20 > 3 ? 'uptrend' : ret20 < -3 ? 'downtrend' : 'range';

  const bias = resolveBias(input.signals, trend);
  const conviction = Math.round(clamp(input.opportunityScore, 0, 100));

  const nearestResistance = input.levels.resistance.find((l) => l > input.currentPrice) ?? input.levels.recentHigh;
  const nearestSupport = [...input.levels.support].reverse().find((l) => l < input.currentPrice) ?? input.levels.recentLow;
  const range =
    input.levels.recentHigh !== null && input.levels.recentLow !== null
      ? Math.max(input.levels.recentHigh - input.levels.recentLow, input.currentPrice * 0.01)
      : input.currentPrice * 0.02;

  const biasWord = t(
    bias === 'bullish' ? 'ai.gen.biasBullish' : bias === 'bearish' ? 'ai.gen.biasBearish' : 'ai.gen.biasNeutral'
  );

  // 1. Executive summary
  const executiveSummary = {
    bias,
    conviction,
    headline: fill(
      t(bias === 'bullish' ? 'ai.gen.headlineBullish' : bias === 'bearish' ? 'ai.gen.headlineBearish' : 'ai.gen.headlineNeutral'),
      { asset: input.asset }
    ),
    text: fill(t('ai.gen.summaryText'), {
      asset: input.asset,
      bias: biasWord,
      conviction,
      resistance: nearestResistance !== null ? fmt(nearestResistance) : '—',
      support: nearestSupport !== null ? fmt(nearestSupport) : '—',
    }),
  };

  // 2. Market structure
  const volLevelWord = input.volatility.level ? t(volLevelKey(input.volatility.level)) : t('ai.gen.volUnknown');
  const marketStructure = {
    trend,
    description: fill(t(`ai.gen.trend${cap(trend)}` as TranslationKey), { asset: input.asset }),
    volatilityRegime:
      input.volatility.ratio !== null
        ? fill(t('ai.gen.volRegime'), { ratio: input.volatility.ratio.toFixed(1), level: volLevelWord })
        : t('ai.gen.volUnknown'),
    momentum: t(ret20 > 1 ? 'ai.gen.momentumUp' : ret20 < -1 ? 'ai.gen.momentumDown' : 'ai.gen.momentumFlat'),
  };

  // 3. Key levels
  const keyLevels: KeyLevel[] = [];
  for (const price of input.levels.resistance) keyLevels.push({ kind: 'resistance', price, note: t('ai.gen.levelResistanceNote') });
  for (const price of input.levels.support) keyLevels.push({ kind: 'support', price, note: t('ai.gen.levelSupportNote') });
  if (input.levels.recentHigh !== null && input.levels.recentLow !== null) {
    keyLevels.push({
      kind: 'pivot',
      price: round((input.levels.recentHigh + input.levels.recentLow + input.currentPrice) / 3),
      note: t('ai.gen.levelPivotNote'),
    });
  }

  // 4. Scenarios
  const probs = scenarioProbabilities(bias, conviction);
  const scenarioList: TradeScenario[] = [
    {
      id: 'bullish',
      name: t('ai.gen.scenarioContinuation'),
      bias: 'bullish',
      probability: probs.bull,
      trigger: nearestResistance !== null ? fill(t('ai.gen.triggerAbove'), { level: fmt(nearestResistance) }) : '—',
      target: nearestResistance !== null ? round(nearestResistance + range * 0.6) : null,
      invalidation: nearestSupport,
      rationale: fill(t('ai.gen.rationaleContinuation'), { asset: input.asset }),
    },
    {
      id: 'bearish',
      name: t('ai.gen.scenarioReversal'),
      bias: 'bearish',
      probability: probs.bear,
      trigger: nearestSupport !== null ? fill(t('ai.gen.triggerBelow'), { level: fmt(nearestSupport) }) : '—',
      target: nearestSupport !== null ? round(nearestSupport - range * 0.6) : null,
      invalidation: nearestResistance,
      rationale: fill(t('ai.gen.rationaleReversal'), { asset: input.asset }),
    },
    {
      id: 'range',
      name: t('ai.gen.scenarioRange'),
      bias: 'neutral',
      probability: probs.range,
      trigger:
        nearestSupport !== null && nearestResistance !== null
          ? fill(t('ai.gen.triggerRange'), { low: fmt(nearestSupport), high: fmt(nearestResistance) })
          : '—',
      target: null,
      invalidation: null,
      rationale: fill(t('ai.gen.rationaleRange'), { asset: input.asset }),
    },
  ];
  const scenarios = [...scenarioList].sort((a, b) => b.probability - a.probability);

  // 5. Conditional trade plan
  const tradePlan: string[] = [
    fill(t('ai.gen.planWatch'), {
      resistance: nearestResistance !== null ? fmt(nearestResistance) : '—',
      support: nearestSupport !== null ? fmt(nearestSupport) : '—',
    }),
    t('ai.gen.planConfirm'),
    t('ai.gen.planManage'),
  ];
  if (input.position.hasPosition) {
    tradePlan.push(fill(t('ai.gen.planPosition'), { direction: input.position.direction ?? '' }));
  }

  // 6. Risk model
  const returns: number[] = [];
  for (let i = 1; i < n; i++) returns.push(closes[i] / closes[i - 1] - 1);
  const stopDistancePercent = returns.length >= 5 ? round(stdev(returns) * 1.5 * 100, 1) : null;
  const suggestedRiskReward = trend === 'range' ? 1.5 : 2;
  const riskModel = {
    suggestedRiskReward,
    stopDistancePercent,
    positionSizingNote: fill(t('ai.gen.sizingNote'), { rr: suggestedRiskReward }),
    maxRiskNote: t('ai.gen.maxRiskNote'),
  };

  // 7. Invalidation rules
  const invalidation: string[] = [];
  const primaryInvalidation = bias === 'bearish' ? nearestResistance : nearestSupport;
  if (primaryInvalidation !== null) {
    invalidation.push(fill(t('ai.gen.invalidationPrimary'), { level: fmt(primaryInvalidation) }));
  }
  if (input.volatility.level === 'EXTREME' || input.volatility.level === 'HIGH') {
    invalidation.push(t('ai.gen.invalidationVol'));
  }

  return {
    asset: input.asset,
    assetName: input.assetName,
    timeframe: input.timeframe,
    executiveSummary,
    marketStructure,
    keyLevels,
    scenarios,
    tradePlan,
    riskModel,
    invalidation,
    macroContext: `${fill(t(macroKey(input.asset)), { asset: input.asset })} ${t('ai.gen.macroDisclaimer')}`,
    source: 'local',
    timestamp: new Date().toISOString(),
  };
}

function resolveBias(signals: string[], trend: 'uptrend' | 'downtrend' | 'range'): MarketBias {
  const bull = signals.includes('BREAKOUT_BULLISH') || signals.includes('MOMENTUM_BULLISH');
  const bear = signals.includes('BREAKOUT_BEARISH') || signals.includes('MOMENTUM_BEARISH');
  if (bull && !bear) return 'bullish';
  if (bear && !bull) return 'bearish';
  return trend === 'uptrend' ? 'bullish' : trend === 'downtrend' ? 'bearish' : 'neutral';
}

function scenarioProbabilities(bias: MarketBias, conviction: number): { bull: number; bear: number; range: number } {
  const tilt = Math.round((conviction / 100) * 22);
  if (bias === 'bullish') {
    const bull = 40 + tilt;
    const bear = Math.round((100 - bull) * 0.45);
    return { bull, bear, range: 100 - bull - bear };
  }
  if (bias === 'bearish') {
    const bear = 40 + tilt;
    const bull = Math.round((100 - bear) * 0.45);
    return { bull, bear, range: 100 - bull - bear };
  }
  const range = 40 + Math.round(tilt / 2);
  const bull = Math.round((100 - range) / 2);
  return { bull, bear: 100 - range - bull, range };
}

function volLevelKey(level: string): TranslationKey {
  switch (level) {
    case 'EXTREME':
      return 'ai.gen.volExtreme';
    case 'HIGH':
      return 'ai.gen.volHigh';
    case 'ELEVATED':
      return 'ai.gen.volElevated';
    default:
      return 'ai.gen.volNormal';
  }
}

function macroKey(symbol: string): TranslationKey {
  const type = resolveAsset(symbol).type;
  switch (type) {
    case 'crypto':
      return 'ai.gen.macroCrypto';
    case 'commodity':
      return 'ai.gen.macroCommodity';
    case 'forex':
      return 'ai.gen.macroForex';
    case 'index':
      return 'ai.gen.macroIndex';
    default:
      return 'ai.gen.macroStock';
  }
}

// --- Optional real LLM path ------------------------------------------------

async function callLlm(input: MarketAnalysisInput, language: 'en' | 'fr'): Promise<MarketAnalysisOutput | null> {
  if (!ANTHROPIC_API_KEY) return null;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(input, language) }],
    }),
  });
  if (!response.ok) return null;

  const data = (await response.json()) as { content?: { text?: string }[] };
  const text = data.content?.[0]?.text;
  if (typeof text !== 'string') return null;

  const parsed = JSON.parse(extractJson(text)) as Partial<MarketAnalysisOutput>;
  return {
    asset: input.asset,
    assetName: input.assetName,
    timeframe: input.timeframe,
    executiveSummary: parsed.executiveSummary!,
    marketStructure: parsed.marketStructure!,
    keyLevels: parsed.keyLevels ?? [],
    scenarios: parsed.scenarios ?? [],
    tradePlan: parsed.tradePlan ?? [],
    riskModel: parsed.riskModel!,
    invalidation: parsed.invalidation ?? [],
    macroContext: parsed.macroContext ?? '',
    source: 'llm',
    timestamp: new Date().toISOString(),
  };
}

function extractJson(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return start >= 0 && end > start ? text.slice(start, end + 1) : text;
}

// --- helpers ---------------------------------------------------------------

function fill(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : ''
  );
}

function uniqueLevels(values: (number | null)[]): number[] {
  const seen: number[] = [];
  for (const value of values) {
    if (value === null || !Number.isFinite(value) || value <= 0) continue;
    const rounded = round(value);
    if (!seen.some((existing) => Math.abs(existing - rounded) / rounded < 0.002)) seen.push(rounded);
  }
  return seen.sort((a, b) => b - a);
}

function mean(values: number[]): number {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function cap(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
