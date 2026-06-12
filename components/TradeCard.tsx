import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import TradeStatusBadge from './TradeStatusBadge';
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

  const isClosed = trade.status === 'closed' && trade.exitPrice !== undefined;
  const direction = trade.direction === 'LONG' ? 1 : -1;
  const pnl = isClosed ? (trade.exitPrice! - trade.entryPrice) * trade.quantity * direction : null;
  const isPositive = (pnl ?? 0) >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.identity}>
          <View style={styles.symbolRow}>
            <Text style={styles.symbol}>{trade.symbol}</Text>
            <TradeStatusBadge status={trade.status} />
          </View>
          <Text style={styles.meta}>
            {trade.direction === 'LONG' ? t('trade.long') : t('trade.short')} ·{' '}
            {trade.quantity} @ {trade.entryPrice}
            {isClosed ? ` → ${trade.exitPrice}` : ''}
          </Text>
        </View>
        {pnl !== null && (
          <Text style={[styles.pnl, { color: isPositive ? colors.positive : colors.negative }]}>
            {isPositive ? '+' : ''}
            {pnl.toFixed(2)}
          </Text>
        )}
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
    identity: {
      flex: 1,
      marginRight: 12,
    },
    symbolRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
