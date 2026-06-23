import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCurrency } from '../store/currency';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { MarketOverviewItem } from '../types/market';

interface MarketOverviewCardProps {
  item: MarketOverviewItem;
  onPress?: (symbol: string) => void;
}

export default function MarketOverviewCard({ item, onPress }: MarketOverviewCardProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const styles = createStyles(colors);

  const hasData = item.price !== null && item.changePercent !== null;
  const isUp = (item.changePercent ?? 0) >= 0;

  return (
    <Pressable
      style={styles.card}
      onPress={onPress ? () => onPress(item.symbol) : undefined}
      disabled={!onPress}
    >
      <Text style={styles.name} numberOfLines={1}>
        {item.displayName}
      </Text>
      {hasData ? (
        <>
          <Text style={styles.price}>{formatPrice(item.price!, item.symbol)}</Text>
          <Text style={[styles.change, { color: isUp ? colors.positive : colors.negative }]}>
            {isUp ? '+' : ''}
            {item.changePercent!.toFixed(2)}%
          </Text>
        </>
      ) : (
        <Text style={styles.unavailable}>{t('market.dataUnavailable')}</Text>
      )}
    </Pressable>
  );
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
    unavailable: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
  });
