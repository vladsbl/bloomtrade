import { TranslationKey } from '../store/translations';

// Translation keys for short weekday names, indexed by JS Date.getDay()
// (0 = Sunday … 6 = Saturday) so they line up with BucketPerf weekday keys.
export const WEEKDAY_KEYS: TranslationKey[] = [
  'analytics.dow.sun',
  'analytics.dow.mon',
  'analytics.dow.tue',
  'analytics.dow.wed',
  'analytics.dow.thu',
  'analytics.dow.fri',
  'analytics.dow.sat',
];

// Translation keys for short month names, indexed 0 = January … 11 = December.
export const MONTH_KEYS: TranslationKey[] = [
  'analytics.month.jan',
  'analytics.month.feb',
  'analytics.month.mar',
  'analytics.month.apr',
  'analytics.month.may',
  'analytics.month.jun',
  'analytics.month.jul',
  'analytics.month.aug',
  'analytics.month.sep',
  'analytics.month.oct',
  'analytics.month.nov',
  'analytics.month.dec',
];

/** Resolve the localized short label for a BucketPerf key of a given kind. */
export function bucketLabel(
  kind: 'weekday' | 'month' | 'hour',
  key: string,
  t: (key: TranslationKey) => string
): string {
  if (kind === 'weekday') {
    const index = Number(key);
    return WEEKDAY_KEYS[index] ? t(WEEKDAY_KEYS[index]) : key;
  }
  if (kind === 'hour') {
    return `${key}h`;
  }
  // month key is "YYYY-MM"
  const [year, month] = key.split('-');
  const index = Number(month) - 1;
  const name = MONTH_KEYS[index] ? t(MONTH_KEYS[index]) : month;
  return `${name} ${String(year).slice(2)}`;
}
