import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ImpactBadge from './ImpactBadge';
import SentimentBadge from './SentimentBadge';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { NewsItem } from '../types/news';

export default function NewsCard({ item, onPress }: { item: NewsItem; onPress?: () => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const hasPriceChange = item.asset && item.priceChangePercent !== undefined;
  const isPriceUp = (item.priceChangePercent ?? 0) >= 0;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.source}>{item.source}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.summary}>{item.summary}</Text>

      <View style={styles.badgeRow}>
        <SentimentBadge sentiment={item.sentiment} />
        <ImpactBadge level={item.impactLevel} score={item.impactScore} />
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
    </Pressable>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
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
