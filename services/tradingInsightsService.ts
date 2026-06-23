import { AnalyticsReport, TradingInsight } from '../types/analytics';
import { TranslationKey } from '../store/translations';
import { bucketLabel } from './analyticsLabels';

type Translate = (key: TranslationKey) => string;
type FormatMoney = (value: number) => string;

// Minimum sample sizes before an observation is trustworthy enough to surface —
// keeps insights grounded in real signal rather than noise.
const MIN_SYMBOL_TRADES = 3;
const MIN_BUCKET_TRADES = 2;
const MIN_CLOSED_FOR_QUALITY = 5;
const WINRATE_EDGE = 10; // pp above the global average to call out a symbol
const LATE_HOUR = 20;

/** Replace {placeholder} tokens in a template with stringified params. */
function fill(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : ''
  );
}

function formatPf(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '∞';
}

/**
 * Derive human-readable observations from the analytics report. Every insight
 * is gated on a real condition + sample size, so nothing is invented: an empty
 * array is returned when the data doesn't support any statement.
 */
export function generateInsights(
  report: AnalyticsReport,
  t: Translate,
  formatMoney: FormatMoney
): TradingInsight[] {
  if (!report.hasData) return [];

  const insights: TradingInsight[] = [];
  const { general, risk, time, assets } = report;

  const push = (id: string, tone: TradingInsight['tone'], text: string) =>
    insights.push({ id, tone, text });

  // 1. A symbol with a win rate clearly above the personal average.
  const edgeSymbol = assets
    .filter((asset) => asset.closedTrades >= MIN_SYMBOL_TRADES)
    .map((asset) => ({ asset, delta: asset.winRate - general.winRate }))
    .filter((entry) => entry.delta >= WINRATE_EDGE)
    .sort((a, b) => b.delta - a.delta)[0];
  if (edgeSymbol) {
    push(
      'best-symbol-winrate',
      'positive',
      fill(t('analytics.insight.bestSymbolWinRate'), {
        symbol: edgeSymbol.asset.symbol,
        delta: Math.round(edgeSymbol.delta),
      })
    );
  }

  // 2. The symbol weighing most on results.
  const worstSymbol = assets
    .filter((asset) => asset.closedTrades >= MIN_BUCKET_TRADES && asset.netPnl < 0)
    .sort((a, b) => a.netPnl - b.netPnl)[0];
  if (worstSymbol) {
    push(
      'worst-symbol',
      'negative',
      fill(t('analytics.insight.worstSymbol'), {
        symbol: worstSymbol.symbol,
        pnl: formatMoney(worstSymbol.netPnl),
        trades: worstSymbol.closedTrades,
      })
    );
  }

  // 3. Most profitable weekday.
  const bestWeekday = time.byWeekday
    .filter((bucket) => bucket.trades >= MIN_BUCKET_TRADES && bucket.netPnl > 0)
    .sort((a, b) => b.netPnl - a.netPnl)[0];
  if (bestWeekday) {
    push(
      'best-weekday',
      'positive',
      fill(t('analytics.insight.bestWeekday'), {
        day: bucketLabel('weekday', bestWeekday.key, t),
      })
    );
  }

  // 4. Late-session unprofitability (falls back to the single worst hour).
  const lateHours = time.byHour.filter((bucket) => Number(bucket.key) >= LATE_HOUR);
  const lateTrades = lateHours.reduce((total, bucket) => total + bucket.trades, 0);
  const lateNet = lateHours.reduce((total, bucket) => total + bucket.netPnl, 0);
  if (lateTrades >= MIN_BUCKET_TRADES && lateNet < 0) {
    push(
      'worst-hour-late',
      'negative',
      fill(t('analytics.insight.worstHourLate'), { hour: LATE_HOUR })
    );
  } else {
    const worstHour = time.byHour
      .filter((bucket) => bucket.trades >= MIN_BUCKET_TRADES && bucket.netPnl < 0)
      .sort((a, b) => a.netPnl - b.netPnl)[0];
    if (worstHour) {
      push(
        'worst-hour',
        'negative',
        fill(t('analytics.insight.worstHour'), { hour: worstHour.key })
      );
    }
  }

  // 5. Holding-time asymmetry (only when durations are available).
  if (time.duration.available && time.duration.ratio !== null) {
    const ratio = time.duration.ratio;
    if (ratio >= 1.5) {
      push(
        'winners-held-longer',
        'positive',
        fill(t('analytics.insight.winnersHeldLonger'), { ratio: ratio.toFixed(1) })
      );
    } else if (ratio > 0 && ratio <= 0.66) {
      push(
        'losers-held-longer',
        'negative',
        fill(t('analytics.insight.losersHeldLonger'), { ratio: (1 / ratio).toFixed(1) })
      );
    }
  }

  // 6. Profit-factor health (needs a reasonable sample).
  if (general.closedTrades >= MIN_CLOSED_FOR_QUALITY) {
    const pf = general.profitFactor;
    if (!Number.isFinite(pf) || pf >= 2) {
      push('profit-factor', 'positive', fill(t('analytics.insight.profitFactorStrong'), { pf: formatPf(pf) }));
    } else if (pf >= 1) {
      push('profit-factor', 'neutral', fill(t('analytics.insight.profitFactorOk'), { pf: formatPf(pf) }));
    } else {
      push('profit-factor', 'negative', fill(t('analytics.insight.profitFactorWeak'), { pf: formatPf(pf) }));
    }
  }

  // 7. High win rate but negative expectancy → losers too big.
  if (general.winRate >= 50 && Number.isFinite(general.profitFactor) && general.profitFactor < 1) {
    push(
      'low-payoff',
      'negative',
      fill(t('analytics.insight.lowPayoff'), { winRate: Math.round(general.winRate) })
    );
  }

  // 8. Drawdown awareness.
  if (general.closedTrades >= MIN_CLOSED_FOR_QUALITY && risk.maxDrawdown > 0) {
    push(
      'drawdown',
      'neutral',
      fill(t('analytics.insight.drawdown'), {
        dd: formatMoney(risk.maxDrawdown),
        pct: Math.round(risk.maxDrawdownPercent),
      })
    );
  }

  // 9. Best winning streak.
  if (risk.bestWinStreak >= 3) {
    push(
      'win-streak',
      'positive',
      fill(t('analytics.insight.winStreak'), { streak: risk.bestWinStreak })
    );
  }

  // 10. Discipline standing (from the discipline sub-score).
  if (report.score.disciplineScore >= 8) {
    push('discipline', 'positive', t('analytics.insight.disciplineHigh'));
  } else if (report.score.disciplineScore <= 4) {
    push('discipline', 'neutral', t('analytics.insight.disciplineLow'));
  }

  return insights;
}
