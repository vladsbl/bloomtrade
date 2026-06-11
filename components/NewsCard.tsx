import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { ImpactLevel, MarketSentiment, NewsItem } from '../types/news';

const SENTIMENT_BADGE: Record<MarketSentiment, { emoji: string; label: string; color: string }> = {
  bullish: { emoji: '🟢', label: 'Bullish', color: colors.positive },
  bearish: { emoji: '🔴', label: 'Bearish', color: colors.negative },
  neutral: { emoji: '⚪', label: 'Neutral', color: colors.neutral },
};

const IMPACT_BADGE: Record<ImpactLevel, { emoji: string; label: string; color: string }> = {
  high: { emoji: '🔴', label: 'High', color: colors.negative },
  medium: { emoji: '🟡', label: 'Medium', color: colors.warning },
  low: { emoji: '🟢', label: 'Low', color: colors.positive },
};

export default function NewsCard({ item }: { item: NewsItem }) {
  const sentimentBadge = SENTIMENT_BADGE[item.sentiment];
  const impactBadge = IMPACT_BADGE[item.impactLevel];
  const hasPriceChange = item.asset && item.priceChangePercent !== undefined;
  const isPriceUp = (item.priceChangePercent ?? 0) >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.source}>{item.source}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.summary}>{item.summary}</Text>

      <View style={styles.badgeRow}>
        <View style={[styles.badge, { borderColor: sentimentBadge.color }]}>
          <Text style={styles.badgeText}>
            {sentimentBadge.emoji} {sentimentBadge.label}
          </Text>
        </View>
        <View style={[styles.badge, { borderColor: impactBadge.color }]}>
          <Text style={styles.badgeText}>
            {impactBadge.emoji} {impactBadge.label}
          </Text>
        </View>
        {hasPriceChange && (
          <View style={[styles.badge, { borderColor: isPriceUp ? colors.positive : colors.negative }]}>
            <Text
              style={[styles.badgeText, { color: isPriceUp ? colors.positive : colors.negative }]}
            >
              {item.asset} {isPriceUp ? '+' : ''}
              {item.priceChangePercent!.toFixed(2)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  source: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  time: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  summary: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
});
