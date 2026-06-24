import { AssetSignals } from '../types/marketSignals';
import { TranslationKey } from '../store/translations';

type Translate = (key: TranslationKey) => string;

/** Replace {placeholder} tokens with stringified params. */
export function fillTemplate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : ''
  );
}

const ratio = (value: number) => value.toFixed(1);

/**
 * Turn an asset's detected signals into readable, localized sentences. Every
 * line is backed by a real signal or metric — nothing is invented.
 */
export function generateAssetInsights(asset: AssetSignals, t: Translate): string[] {
  const out: string[] = [];
  const symbol = asset.symbol;

  for (const signal of asset.signals) {
    switch (signal.kind) {
      case 'BREAKOUT_BULLISH':
        out.push(fillTemplate(t('scanner.insight.breakoutBullish'), { symbol }));
        break;
      case 'BREAKOUT_BEARISH':
        out.push(fillTemplate(t('scanner.insight.breakoutBearish'), { symbol }));
        break;
      case 'MOMENTUM_BULLISH':
        out.push(fillTemplate(t('scanner.insight.momentumBullish'), { symbol }));
        break;
      case 'MOMENTUM_BEARISH':
        out.push(fillTemplate(t('scanner.insight.momentumBearish'), { symbol }));
        break;
      case 'UNUSUAL_VOLUME':
        out.push(fillTemplate(t('scanner.insight.volume'), { symbol, ratio: ratio(signal.ratio) }));
        break;
      case 'HIGH_VOLATILITY':
        out.push(fillTemplate(t('scanner.insight.volatility'), { symbol, ratio: ratio(signal.ratio) }));
        break;
    }
  }

  // Streak observation (independent of the momentum signal threshold).
  if (asset.metrics.upStreak >= 3) {
    out.push(fillTemplate(t('scanner.insight.streakUp'), { symbol, n: asset.metrics.upStreak }));
  } else if (asset.metrics.downStreak >= 3) {
    out.push(fillTemplate(t('scanner.insight.streakDown'), { symbol, n: asset.metrics.downStreak }));
  }

  return out;
}
