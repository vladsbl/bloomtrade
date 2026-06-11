import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { MarketSentiment } from '../types/news';

export default function SentimentBadge({ sentiment }: { sentiment: MarketSentiment }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const SENTIMENT_BADGE: Record<MarketSentiment, { emoji: string; label: string; color: string }> = {
    bullish: { emoji: '🟢', label: t('sentiment.bullish'), color: colors.positive },
    bearish: { emoji: '🔴', label: t('sentiment.bearish'), color: colors.negative },
    neutral: { emoji: '🟡', label: t('sentiment.neutral'), color: colors.warning },
  };

  const badge = SENTIMENT_BADGE[sentiment];

  return (
    <View style={[styles.badge, { borderColor: badge.color }]}>
      <Text style={styles.text}>
        {badge.emoji} {badge.label}
      </Text>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    badge: {
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    text: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '600',
    },
  });
