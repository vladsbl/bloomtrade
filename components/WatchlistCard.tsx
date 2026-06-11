import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { WatchlistItem } from '../types/market';

interface WatchlistCardProps {
  item: WatchlistItem;
  onRemove: (symbol: string) => void;
}

export default function WatchlistCard({ item, onRemove }: WatchlistCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const hasQuote = item.price !== null && item.changePercent !== null;
  const isUp = (item.changePercent ?? 0) >= 0;

  return (
    <View style={styles.row}>
      <Text style={styles.symbol}>{item.symbol}</Text>

      <View style={styles.values}>
        {hasQuote ? (
          <>
            <Text style={styles.price}>${item.price!.toFixed(2)}</Text>
            <Text style={[styles.change, { color: isUp ? colors.positive : colors.negative }]}>
              {isUp ? '+' : ''}
              {item.changePercent!.toFixed(2)}%
            </Text>
          </>
        ) : (
          <Text style={styles.unavailable}>--</Text>
        )}
      </View>

      <Pressable onPress={() => onRemove(item.symbol)} hitSlop={8} style={styles.removeButton}>
        <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 8,
    },
    symbol: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    values: {
      alignItems: 'flex-end',
      marginRight: 12,
    },
    price: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    change: {
      fontSize: 12,
      fontWeight: '700',
      marginTop: 2,
    },
    unavailable: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    removeButton: {
      padding: 2,
    },
  });
