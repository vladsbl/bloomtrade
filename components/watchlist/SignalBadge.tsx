import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../store/i18n';
import { useTheme } from '../../store/theme';
import { ColorPalette } from '../../theme/palettes';
import { TranslationKey } from '../../store/translations';
import { SignalKind, SignalTone } from '../../types/marketSignals';

interface SignalMeta {
  emoji: string;
  labelKey: TranslationKey;
  tone: SignalTone;
}

const META: Record<SignalKind, SignalMeta> = {
  BREAKOUT_BULLISH: { emoji: '🔥', labelKey: 'scanner.signal.breakoutUp', tone: 'bullish' },
  BREAKOUT_BEARISH: { emoji: '🔻', labelKey: 'scanner.signal.breakoutDown', tone: 'bearish' },
  MOMENTUM_BULLISH: { emoji: '📈', labelKey: 'scanner.signal.momentumUp', tone: 'bullish' },
  MOMENTUM_BEARISH: { emoji: '📉', labelKey: 'scanner.signal.momentumDown', tone: 'bearish' },
  UNUSUAL_VOLUME: { emoji: '⚡', labelKey: 'scanner.signal.volume', tone: 'warning' },
  HIGH_VOLATILITY: { emoji: '🌪', labelKey: 'scanner.signal.volatility', tone: 'warning' },
};

export function toneColor(tone: SignalTone, colors: ColorPalette): string {
  switch (tone) {
    case 'bullish':
      return colors.positive;
    case 'bearish':
      return colors.negative;
    case 'warning':
      return colors.warning;
    default:
      return colors.textSecondary;
  }
}

/** A compact, color-coded badge for one detected market signal. */
export default function SignalBadge({ kind }: { kind: SignalKind }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const meta = META[kind];
  const color = toneColor(meta.tone, colors);

  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
      <Text style={styles.emoji}>{meta.emoji}</Text>
      <Text style={[styles.label, { color }]}>{t(meta.labelKey)}</Text>
    </View>
  );
}

const createStyles = (_colors: ColorPalette) =>
  StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
    },
    emoji: {
      fontSize: 11,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
    },
  });
