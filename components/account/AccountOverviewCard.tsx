import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../store/i18n';
import { useTheme } from '../../store/theme';
import { useTradingAccount } from '../../store/tradingAccount';
import { AccountSummary } from '../../types/account';
import { ColorPalette } from '../../theme/palettes';

/** Account dashboard: equity hero + the key capital / P&L figures. */
export default function AccountOverviewCard({ summary }: { summary: AccountSummary }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { formatMoney } = useTradingAccount();
  const styles = createStyles(colors);

  const returnUp = summary.totalReturnPercent >= 0;
  const returnColor = returnUp ? colors.positive : colors.negative;
  const toneColor = (value: number) =>
    value > 0 ? colors.positive : value < 0 ? colors.negative : colors.text;

  return (
    <View style={styles.card}>
      <Text style={styles.heroLabel}>{t('account.currentCapital')}</Text>
      <Text style={styles.heroValue}>{formatMoney(summary.currentCapital)}</Text>
      <Text style={[styles.heroReturn, { color: returnColor }]}>
        {returnUp ? '+' : ''}
        {summary.totalReturnPercent.toFixed(2)}%
      </Text>

      <View style={styles.divider} />

      <Row label={t('account.initialCapital')} value={formatMoney(summary.initialCapital)} colors={colors} />
      <Row
        label={t('account.realizedPnl')}
        value={formatMoney(summary.realizedPnl, { signed: true })}
        valueColor={toneColor(summary.realizedPnl)}
        colors={colors}
      />
      <Row
        label={t('account.unrealizedPnl')}
        value={formatMoney(summary.unrealizedPnl, { signed: true })}
        valueColor={toneColor(summary.unrealizedPnl)}
        colors={colors}
      />
      <Row label={t('account.investedCapital')} value={formatMoney(summary.investedCapital)} colors={colors} />
      <Row label={t('account.marginUsed')} value={formatMoney(summary.marginUsed)} colors={colors} />
      <Row label={t('account.availableCapital')} value={formatMoney(summary.availableCapital)} colors={colors} />
      <Row
        label={t('account.openPositions')}
        value={String(summary.openPositionsCount)}
        colors={colors}
      />
    </View>
  );
}

function Row({
  label,
  value,
  valueColor,
  colors,
}: {
  label: string;
  value: string;
  valueColor?: string;
  colors: ColorPalette;
}) {
  const styles = createStyles(colors);
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, !!valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    heroLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    heroValue: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '800',
      marginTop: 6,
    },
    heroReturn: {
      fontSize: 15,
      fontWeight: '700',
      marginTop: 4,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: 14,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    rowLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    rowValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
  });
