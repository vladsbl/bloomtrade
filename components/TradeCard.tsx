import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { Trade } from '../types/trade';

export default function TradeCard({
  trade,
  onDelete,
}: {
  trade: Trade;
  onDelete: (id: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const direction = trade.direction === 'LONG' ? 1 : -1;
  const pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity * direction;
  const isPositive = pnl >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.symbol}>{trade.symbol}</Text>
          <Text style={styles.meta}>
            {trade.direction === 'LONG' ? t('trade.long') : t('trade.short')} ·{' '}
            {trade.quantity} @ {trade.entryPrice} → {trade.exitPrice}
          </Text>
        </View>
        <Text style={[styles.pnl, { color: isPositive ? colors.positive : colors.negative }]}>
          {isPositive ? '+' : ''}
          {pnl.toFixed(2)}
        </Text>
      </View>
      {!!trade.notes && <Text style={styles.notes}>{trade.notes}</Text>}
      <Pressable onPress={() => onDelete(trade.id)} hitSlop={8}>
        <Text style={styles.delete}>{t('journal.delete')}</Text>
      </Pressable>
    </View>
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
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    symbol: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 4,
    },
    pnl: {
      fontSize: 16,
      fontWeight: '700',
    },
    notes: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 8,
      fontStyle: 'italic',
    },
    delete: {
      color: colors.negative,
      fontSize: 12,
      marginTop: 10,
      fontWeight: '600',
    },
  });
