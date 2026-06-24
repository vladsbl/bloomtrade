import { JournalDay } from '../types/journal';
import { Trade } from '../types/trade';
import {
  AnalyticsReport,
  AssetPerf,
  BucketPerf,
  DirectionStats,
  DurationStats,
  EquityPoint,
  GeneralStats,
  HistogramBin,
  RiskStats,
  TimeStats,
  TradingScore,
} from '../types/analytics';

// How many symbols to surface in the best/worst rankings.
const RANKING_SIZE = 5;

/**
 * A trade flattened with its journal day and a computed realized result.
 * `pnl` is only meaningful for closed trades (where exitPrice is set).
 */
interface AnalyzedTrade {
  symbol: string;
  direction: 'LONG' | 'SHORT';
  date: string; // YYYY-MM-DD (the journal day)
  status: Trade['status'];
  quantity: number;
  cost: number; // entryPrice * |quantity| — used for sizing discipline
  hasNotes: boolean;
  isClosed: boolean;
  pnl: number; // realized PnL (0 for open trades)
  openedAt: number | null;
  closedAt: number | null;
  durationMs: number | null; // closedAt - openedAt when both known
  orderKey: number; // chronological sort key
}

// --- Public API ------------------------------------------------------------

/**
 * Build the full analytics report from the journal. Pure and deterministic:
 * no i18n, no network, no side effects. Safe on empty / partial data — every
 * metric is guarded against division by zero and missing fields.
 */
export function buildAnalytics(days: Record<string, JournalDay>): AnalyticsReport {
  const trades = flattenTrades(days);
  const closed = trades.filter((trade) => trade.isClosed);

  const general = computeGeneral(trades, closed);
  const equityCurve = computeEquityCurve(closed);
  const risk = computeRisk(closed, equityCurve, general);
  const time = computeTime(closed);
  const assets = computeAssets(trades);
  const { topAssets, worstAssets } = rankAssets(assets);
  const score = computeScore({ general, risk, trades, closed });

  return {
    hasTrades: trades.length > 0,
    hasData: closed.length > 0,
    general,
    risk,
    time,
    assets,
    topAssets,
    worstAssets,
    long: computeDirection(trades, 'LONG'),
    short: computeDirection(trades, 'SHORT'),
    score,
    equityCurve,
    pnlHistogram: computeHistogram(closed),
  };
}

// --- Flattening ------------------------------------------------------------

function flattenTrades(days: Record<string, JournalDay>): AnalyzedTrade[] {
  const result: AnalyzedTrade[] = [];

  for (const day of Object.values(days)) {
    if (!day?.trades) continue;
    for (const trade of day.trades) {
      const quantity = Number(trade.quantity) || 0;
      const entryPrice = Number(trade.entryPrice) || 0;
      const isClosed = trade.status === 'closed' && trade.exitPrice !== undefined;
      const direction = trade.direction === 'SHORT' ? -1 : 1;
      const pnl = isClosed ? (Number(trade.exitPrice) - entryPrice) * quantity * direction : 0;
      const openedAt = Number.isFinite(trade.openedAt) ? (trade.openedAt as number) : null;
      const closedAt = Number.isFinite(trade.closedAt) ? (trade.closedAt as number) : null;
      const durationMs =
        openedAt !== null && closedAt !== null && closedAt > openedAt ? closedAt - openedAt : null;

      result.push({
        symbol: trade.symbol,
        direction: trade.direction === 'SHORT' ? 'SHORT' : 'LONG',
        date: day.date,
        status: trade.status,
        quantity,
        cost: Math.abs(entryPrice * quantity),
        hasNotes: !!trade.notes && trade.notes.trim().length > 0,
        isClosed,
        pnl,
        openedAt,
        closedAt,
        durationMs,
        orderKey: openedAt ?? dayToTimestamp(day.date),
      });
    }
  }

  // Chronological order so streaks / drawdown / equity curve are meaningful.
  return result.sort((a, b) => a.orderKey - b.orderKey);
}

function dayToTimestamp(date: string): number {
  const parsed = Date.parse(date);
  return Number.isFinite(parsed) ? parsed : 0;
}

// --- General stats ---------------------------------------------------------

function computeGeneral(trades: AnalyzedTrade[], closed: AnalyzedTrade[]): GeneralStats {
  const winners = closed.filter((trade) => trade.pnl > 0);
  const losers = closed.filter((trade) => trade.pnl < 0);
  const breakEven = closed.filter((trade) => trade.pnl === 0);

  const grossProfit = sum(winners.map((trade) => trade.pnl));
  const grossLoss = Math.abs(sum(losers.map((trade) => trade.pnl)));
  const netPnl = grossProfit - grossLoss;

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    openTrades: trades.length - closed.length,
    winningTrades: winners.length,
    losingTrades: losers.length,
    breakEvenTrades: breakEven.length,
    winRate: closed.length > 0 ? (winners.length / closed.length) * 100 : 0,
    averageWin: winners.length > 0 ? grossProfit / winners.length : 0,
    averageLoss: losers.length > 0 ? grossLoss / losers.length : 0,
    grossProfit,
    grossLoss,
    netPnl,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    expectancy: closed.length > 0 ? netPnl / closed.length : 0,
    bestTrade: closed.length > 0 ? Math.max(...closed.map((trade) => trade.pnl)) : 0,
    worstTrade: closed.length > 0 ? Math.min(...closed.map((trade) => trade.pnl)) : 0,
  };
}

// --- Equity curve & risk ---------------------------------------------------

function computeEquityCurve(closed: AnalyzedTrade[]): EquityPoint[] {
  const curve: EquityPoint[] = [{ index: 0, value: 0 }];
  let equity = 0;
  closed.forEach((trade, i) => {
    equity += trade.pnl;
    curve.push({ index: i + 1, value: equity });
  });
  return curve;
}

function computeRisk(
  closed: AnalyzedTrade[],
  equityCurve: EquityPoint[],
  general: GeneralStats
): RiskStats {
  let peak = 0;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  for (const point of equityCurve) {
    if (point.value > peak) peak = point.value;
    const drawdown = peak - point.value;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;
    }
  }

  const { bestWinStreak, worstLossStreak } = computeStreaks(closed);

  return {
    maxDrawdown,
    maxDrawdownPercent,
    bestWinStreak,
    worstLossStreak,
    payoffRatio:
      general.averageLoss > 0
        ? general.averageWin / general.averageLoss
        : general.averageWin > 0
          ? Infinity
          : 0,
    recoveryFactor:
      maxDrawdown > 0 ? general.netPnl / maxDrawdown : general.netPnl > 0 ? Infinity : 0,
    resultsVolatility: stdev(closed.map((trade) => trade.pnl)),
    averageRisk: average(closed.map((trade) => trade.cost)),
  };
}

function computeStreaks(closed: AnalyzedTrade[]): {
  bestWinStreak: number;
  worstLossStreak: number;
} {
  let bestWin = 0;
  let worstLoss = 0;
  let win = 0;
  let loss = 0;
  for (const trade of closed) {
    if (trade.pnl > 0) {
      win += 1;
      loss = 0;
    } else if (trade.pnl < 0) {
      loss += 1;
      win = 0;
    } else {
      win = 0;
      loss = 0;
    }
    bestWin = Math.max(bestWin, win);
    worstLoss = Math.max(worstLoss, loss);
  }
  return { bestWinStreak: bestWin, worstLossStreak: worstLoss };
}

// --- Temporal analysis -----------------------------------------------------

function computeTime(closed: AnalyzedTrade[]): TimeStats {
  const weekday = new Map<string, BucketAccumulator>();
  const week = new Map<string, BucketAccumulator>();
  const month = new Map<string, BucketAccumulator>();
  const hour = new Map<string, BucketAccumulator>();

  for (const trade of closed) {
    const date = new Date(`${trade.date}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      accumulate(weekday, String(date.getDay()), trade);
      accumulate(week, weekKey(date), trade);
      accumulate(month, monthKey(trade.date), trade);
    }
    if (trade.openedAt !== null) {
      accumulate(hour, String(new Date(trade.openedAt).getHours()), trade);
    }
  }

  const byWeekday = toBuckets(weekday).sort((a, b) => Number(a.key) - Number(b.key));
  const byHour = toBuckets(hour).sort((a, b) => Number(a.key) - Number(b.key));

  return {
    byWeekday,
    byWeek: toBuckets(week).sort((a, b) => a.key.localeCompare(b.key)),
    byMonth: toBuckets(month).sort((a, b) => a.key.localeCompare(b.key)),
    byHour,
    duration: computeDuration(closed),
    bestDay: extremeBucket(byWeekday, 'max'),
    worstDay: extremeBucket(byWeekday, 'min'),
    bestHour: extremeBucket(byHour, 'max'),
    worstHour: extremeBucket(byHour, 'min'),
  };
}

/** The bucket with the highest/lowest netPnl, or null when there are none. */
function extremeBucket(buckets: BucketPerf[], mode: 'max' | 'min'): BucketPerf | null {
  if (buckets.length === 0) return null;
  return buckets.reduce((best, bucket) =>
    (mode === 'max' ? bucket.netPnl > best.netPnl : bucket.netPnl < best.netPnl) ? bucket : best
  );
}

// ISO-ish week key = the Monday of the trade's week, as "YYYY-MM-DD".
function weekKey(date: Date): string {
  const monday = new Date(date);
  const day = (monday.getDay() + 6) % 7; // 0 = Monday
  monday.setDate(monday.getDate() - day);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface BucketAccumulator {
  trades: number;
  wins: number;
  netPnl: number;
}

function accumulate(map: Map<string, BucketAccumulator>, key: string, trade: AnalyzedTrade): void {
  const bucket = map.get(key) ?? { trades: 0, wins: 0, netPnl: 0 };
  bucket.trades += 1;
  if (trade.pnl > 0) bucket.wins += 1;
  bucket.netPnl += trade.pnl;
  map.set(key, bucket);
}

function toBuckets(map: Map<string, BucketAccumulator>): BucketPerf[] {
  return Array.from(map.entries()).map(([key, bucket]) => ({
    key,
    trades: bucket.trades,
    netPnl: bucket.netPnl,
    winRate: bucket.trades > 0 ? (bucket.wins / bucket.trades) * 100 : 0,
  }));
}

function monthKey(date: string): string {
  return date.slice(0, 7); // "YYYY-MM"
}

function computeDuration(closed: AnalyzedTrade[]): DurationStats {
  const timed = closed.filter(
    (trade) => trade.openedAt !== null && trade.closedAt !== null && trade.closedAt > trade.openedAt
  );
  if (timed.length === 0) {
    return { available: false, averageWinningMs: null, averageLosingMs: null, ratio: null, sampleSize: 0 };
  }

  const winning = timed.filter((trade) => trade.pnl > 0).map((trade) => trade.closedAt! - trade.openedAt!);
  const losing = timed.filter((trade) => trade.pnl < 0).map((trade) => trade.closedAt! - trade.openedAt!);

  const averageWinningMs = winning.length > 0 ? average(winning) : null;
  const averageLosingMs = losing.length > 0 ? average(losing) : null;

  return {
    available: true,
    averageWinningMs,
    averageLosingMs,
    ratio:
      averageWinningMs !== null && averageLosingMs !== null && averageLosingMs > 0
        ? averageWinningMs / averageLosingMs
        : null,
    sampleSize: timed.length,
  };
}

// --- Asset analysis --------------------------------------------------------

interface AssetAccumulator {
  trades: number;
  closed: number;
  wins: number;
  netPnl: number;
  durations: number[]; // holding times of timed closed trades
}

function computeAssets(trades: AnalyzedTrade[]): AssetPerf[] {
  const bySymbol = new Map<string, AssetAccumulator>();

  for (const trade of trades) {
    const entry =
      bySymbol.get(trade.symbol) ?? { trades: 0, closed: 0, wins: 0, netPnl: 0, durations: [] };
    entry.trades += 1;
    if (trade.isClosed) {
      entry.closed += 1;
      entry.netPnl += trade.pnl;
      if (trade.pnl > 0) entry.wins += 1;
      if (trade.durationMs !== null) entry.durations.push(trade.durationMs);
    }
    bySymbol.set(trade.symbol, entry);
  }

  return Array.from(bySymbol.entries())
    .map(([symbol, entry]) => ({
      symbol,
      trades: entry.trades,
      closedTrades: entry.closed,
      netPnl: entry.netPnl,
      winRate: entry.closed > 0 ? (entry.wins / entry.closed) * 100 : 0,
      averagePnl: entry.closed > 0 ? entry.netPnl / entry.closed : 0,
      averageDurationMs: entry.durations.length > 0 ? average(entry.durations) : null,
    }))
    .sort((a, b) => b.netPnl - a.netPnl);
}

// --- Long / Short breakdown ------------------------------------------------

function computeDirection(trades: AnalyzedTrade[], direction: 'LONG' | 'SHORT'): DirectionStats {
  const subset = trades.filter((trade) => trade.direction === direction);
  const closed = subset.filter((trade) => trade.isClosed);
  const winners = closed.filter((trade) => trade.pnl > 0);
  const grossProfit = sum(winners.map((trade) => trade.pnl));
  const grossLoss = Math.abs(sum(closed.filter((trade) => trade.pnl < 0).map((trade) => trade.pnl)));

  return {
    direction,
    trades: subset.length,
    closedTrades: closed.length,
    netPnl: grossProfit - grossLoss,
    winRate: closed.length > 0 ? (winners.length / closed.length) * 100 : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
  };
}

// --- Win/loss histogram ----------------------------------------------------

const HISTOGRAM_BINS = 7;

function computeHistogram(closed: AnalyzedTrade[]): HistogramBin[] {
  if (closed.length === 0) return [];
  const pnls = closed.map((trade) => trade.pnl);
  const min = Math.min(...pnls);
  const max = Math.max(...pnls);

  if (min === max) {
    return [{ lowerEdge: min, upperEdge: max, count: pnls.length, isWin: min >= 0 }];
  }

  const step = (max - min) / HISTOGRAM_BINS;
  const bins: HistogramBin[] = Array.from({ length: HISTOGRAM_BINS }, (_, i) => {
    const lowerEdge = min + i * step;
    const upperEdge = i === HISTOGRAM_BINS - 1 ? max : lowerEdge + step;
    return { lowerEdge, upperEdge, count: 0, isWin: (lowerEdge + upperEdge) / 2 >= 0 };
  });

  for (const pnl of pnls) {
    const idx = Math.min(HISTOGRAM_BINS - 1, Math.max(0, Math.floor((pnl - min) / step)));
    bins[idx].count += 1;
  }
  return bins;
}

function rankAssets(assets: AssetPerf[]): { topAssets: AssetPerf[]; worstAssets: AssetPerf[] } {
  const ranked = assets.filter((asset) => asset.closedTrades > 0);
  return {
    topAssets: ranked.filter((asset) => asset.netPnl > 0).slice(0, RANKING_SIZE),
    worstAssets: ranked
      .filter((asset) => asset.netPnl < 0)
      .slice(-RANKING_SIZE)
      .reverse(),
  };
}

// --- Trading score ---------------------------------------------------------
//
// 100 points: Performance 40 / Risk 30 / Consistency 20 / Discipline 10.
// Each sub-component maps a real statistic onto a points range with clamping,
// so partial / weak data yields a low (never negative, never NaN) score.

function computeScore(input: {
  general: GeneralStats;
  risk: RiskStats;
  trades: AnalyzedTrade[];
  closed: AnalyzedTrade[];
}): TradingScore {
  const { general, risk, trades, closed } = input;

  if (closed.length === 0) {
    return { score: 0, performanceScore: 0, riskScore: 0, consistencyScore: 0, disciplineScore: 0 };
  }

  const performanceScore = round(performancePoints(general));
  const riskScore = round(riskPoints(general, risk));
  const consistencyScore = round(consistencyPoints(closed));
  const disciplineScore = round(disciplinePoints(trades));

  return {
    performanceScore,
    riskScore,
    consistencyScore,
    disciplineScore,
    score: performanceScore + riskScore + consistencyScore + disciplineScore,
  };
}

// Performance (40): profit factor (20) + win rate (10) + expectancy (10).
function performancePoints(general: GeneralStats): number {
  const pf = Number.isFinite(general.profitFactor) ? general.profitFactor : 3; // ∞ → strong
  const pfPoints = scale(pf, 1, 2) * 20; // pf 1→0, 2+→20
  const wrPoints = scale(general.winRate, 30, 60) * 10; // 30%→0, 60%+→10
  const expPoints =
    general.expectancy > 0
      ? general.averageLoss > 0
        ? scale(general.expectancy / general.averageLoss, 0, 1) * 10 // expectancy ≥ 1R → 10
        : 10
      : 0;
  return pfPoints + wrPoints + expPoints;
}

// Risk (30): recovery factor (15) + payoff ratio (10) + loss-streak control (5).
function riskPoints(general: GeneralStats, risk: RiskStats): number {
  const rfPoints =
    general.netPnl <= 0
      ? 0
      : risk.maxDrawdown === 0
        ? 15
        : scale(risk.recoveryFactor, 0, 3) * 15; // RF 3+ → 15
  const payoff = Number.isFinite(risk.payoffRatio) ? risk.payoffRatio : 2;
  const payoffPoints = scale(payoff, 0.5, 2) * 10; // 0.5→0, 2+→10
  const streakPoints = (1 - scale(risk.worstLossStreak, 2, 8)) * 5; // ≤2→5, ≥8→0
  return rfPoints + payoffPoints + streakPoints;
}

// Consistency (20): share of profitable days (10) + low daily-PnL dispersion (10).
function consistencyPoints(closed: AnalyzedTrade[]): number {
  const byDay = new Map<string, number>();
  for (const trade of closed) {
    byDay.set(trade.date, (byDay.get(trade.date) ?? 0) + trade.pnl);
  }
  const dailyPnls = Array.from(byDay.values());
  if (dailyPnls.length === 0) return 0;

  const winningDays = dailyPnls.filter((value) => value > 0).length;
  const winningDaysRatio = winningDays / dailyPnls.length;

  if (dailyPnls.length < 3) {
    // Too few days to judge dispersion — base the whole 20 on win-day ratio.
    return winningDaysRatio * 20;
  }

  const meanAbs = average(dailyPnls.map((value) => Math.abs(value))) || 1;
  const dispersion = clamp01(stdev(dailyPnls) / meanAbs); // 0 = perfectly steady
  return winningDaysRatio * 10 + (1 - dispersion) * 10;
}

// Discipline (10): journaling rate (5) + position-sizing consistency (5).
function disciplinePoints(trades: AnalyzedTrade[]): number {
  if (trades.length === 0) return 0;

  const notesRatio = trades.filter((trade) => trade.hasNotes).length / trades.length;
  const journalPoints = notesRatio * 5;

  const costs = trades.map((trade) => trade.cost).filter((cost) => cost > 0);
  let sizingPoints = 2.5; // neutral when there isn't enough sizing data
  if (costs.length >= 2) {
    const mean = average(costs) || 1;
    const cv = clamp01(stdev(costs) / mean); // coefficient of variation
    sizingPoints = (1 - cv) * 5;
  }

  return journalPoints + sizingPoints;
}

// --- Numeric helpers -------------------------------------------------------

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]): number {
  return values.length > 0 ? sum(values) / values.length : 0;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

/** Map `value` from [lo, hi] onto [0, 1], clamped. */
function scale(value: number, lo: number, hi: number): number {
  if (hi === lo) return 0;
  return clamp01((value - lo) / (hi - lo));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function round(value: number): number {
  return Math.round(Number.isFinite(value) ? value : 0);
}
