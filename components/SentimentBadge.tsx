import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { MarketSentiment } from '../types/news';

const SENTIMENT_BADGE: Record<MarketSentiment, { emoji: string; label: string; color: string }> = {
  bullish: { emoji: '🟢', label: 'Bullish', color: colors.positive },
  bearish: { emoji: '🔴', label: 'Bearish', color: colors.negative },
  neutral: { emoji: '🟡', label: 'Neutral', color: colors.warning },
};

export default function SentimentBadge({ sentiment }: { sentiment: MarketSentiment }) {
  const badge = SENTIMENT_BADGE[sentiment];

  return (
    <View style={[styles.badge, { borderColor: badge.color }]}>
      <Text style={styles.text}>
        {badge.emoji} {badge.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
