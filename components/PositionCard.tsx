import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { Position } from '../types/portfolio';

export default function PositionCard({ item }: { item: Position }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const hasPrice = item.currentPrice !== null;
  const isUp = item.unrealizedPnl >= 0;
  const pnlColor = isUp ? colors.positive : colors.negative;
  const sign = isUp ? '+' : '';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.identity}>
          <Text style={styles.symbol}>{item.asset}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        {hasPrice ? (
          <View style={styles.pnlBox}>
            <Text style={styles.pnlLabel}>{t('portfolio.unrealizedPnl')}</Text>
            <Text style={[styles.pnl, { color: pnlColor }]}>
              {sign}
              {item.unrealizedPnl.toFixed(2)}
            </Text>
            <Text style={[styles.pnlPercent, { color: pnlColor }]}>
              {sign}
              {item.unrealizedPnlPercent.toFixed(2)}%
            </Text>
          </View>
        ) : (
          <Text style={styles.unavailable}>{t('market.dataUnavailable')}</Text>
        )}
      </View>

      <View style={styles.metricsRow}>
        <Metric label={t('portfolio.quantity')} value={formatQty(item.quantity)} colors={colors} />
        <Metric
          label={t('portfolio.avgEntry')}
          value={`$${item.entryPrice.toFixed(2)}`}
          colors={colors}
        />
        <Metric
          label={t('portfolio.current')}
          value={hasPrice ? `$${item.currentPrice!.toFixed(2)}` : '—'}
          colors={colors}
        />
        <Metric
          label={t('portfolio.value')}
          value={hasPrice ? `$${formatValue(item.marketValue)}` : '—'}
          colors={colors}
        />
      </View>
    </View>
  );
}

function Metric({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ColorPalette;
}) {
  const styles = createStyles(colors);
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function formatQty(qty: number): string {
  const rounded = Math.round(qty * 1e6) / 1e6;
  return rounded.toString();
}

function formatValue(value: number): string {
  return value >= 1000
    ? value.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : value.toFixed(2);
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    identity: {
      flex: 1,
      marginRight: 12,
    },
    symbol: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    name: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    pnlBox: {
      alignItems: 'flex-end',
    },
    pnlLabel: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 3,
    },
    pnl: {
      fontSize: 16,
      fontWeight: '800',
    },
    pnlPercent: {
      fontSize: 12,
      fontWeight: '700',
      marginTop: 2,
    },
    unavailable: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    metric: {
      flex: 1,
    },
    metricLabel: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 3,
    },
    metricValue: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
    },
  });
