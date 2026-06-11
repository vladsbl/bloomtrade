import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { MarketOverviewItem } from '../types/market';

export default function MarketOverviewCard({ item }: { item: MarketOverviewItem }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const isUp = item.changePercent >= 0;

  return (
    <View style={styles.card}>
      <Text style={styles.name} numberOfLines={1}>
        {item.displayName}
      </Text>
      <Text style={styles.price}>${formatPrice(item.price)}</Text>
      <Text style={[styles.change, { color: isUp ? colors.positive : colors.negative }]}>
        {isUp ? '+' : ''}
        {item.changePercent.toFixed(2)}%
      </Text>
    </View>
  );
}

function formatPrice(price: number): string {
  return price >= 1000
    ? price.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : price.toFixed(2);
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginRight: 10,
      minWidth: 130,
    },
    name: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    price: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 4,
    },
    change: {
      fontSize: 13,
      fontWeight: '700',
    },
  });
