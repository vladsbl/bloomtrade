import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { TopMoverItem } from '../types/market';

interface TopMoversCardProps {
  title: string;
  items: TopMoverItem[];
  emptyLabel: string;
}

export default function TopMoversCard({ title, items, emptyLabel }: TopMoversCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {items.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        items.map((item) => {
          const isUp = item.changePercent >= 0;
          return (
            <View key={item.symbol} style={styles.row}>
              <Text style={styles.symbol}>{item.symbol}</Text>
              <Text style={[styles.change, { color: isUp ? colors.positive : colors.negative }]}>
                {isUp ? '+' : ''}
                {item.changePercent.toFixed(2)}%
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    title: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    symbol: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    change: {
      fontSize: 13,
      fontWeight: '700',
    },
    empty: {
      color: colors.textSecondary,
      fontSize: 12,
    },
  });
