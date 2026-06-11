import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { Trade } from '../types/trade';

export default function TradeCard({
  trade,
  onDelete,
}: {
  trade: Trade;
  onDelete: (id: string) => void;
}) {
  const direction = trade.direction === 'LONG' ? 1 : -1;
  const pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity * direction;
  const isPositive = pnl >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.symbol}>{trade.symbol}</Text>
          <Text style={styles.meta}>
            {trade.direction} · {trade.quantity} @ {trade.entryPrice} → {trade.exitPrice}
          </Text>
          <Text style={styles.date}>{trade.date}</Text>
        </View>
        <Text style={[styles.pnl, { color: isPositive ? colors.positive : colors.negative }]}>
          {isPositive ? '+' : ''}
          {pnl.toFixed(2)}
        </Text>
      </View>
      {!!trade.notes && <Text style={styles.notes}>{trade.notes}</Text>}
      <Pressable onPress={() => onDelete(trade.id)} hitSlop={8}>
        <Text style={styles.delete}>Supprimer</Text>
      </Pressable>
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
  date: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
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
