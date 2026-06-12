import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PositionCard from '../components/PositionCard';
import { getPortfolio } from '../services/portfolioService';
import { useLanguage } from '../store/i18n';
import { useJournalByDate } from '../store/journalByDate';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { PortfolioSummary } from '../types/portfolio';

const EMPTY_SUMMARY: PortfolioSummary = {
  positions: [],
  totalValue: 0,
  totalCost: 0,
  totalUnrealizedPnl: 0,
  totalUnrealizedPnlPercent: 0,
  totalRealizedPnl: 0,
};

export default function PortfolioScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const { days } = useJournalByDate();
  const [summary, setSummary] = useState<PortfolioSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const result = await getPortfolio(days).catch(() => EMPTY_SUMMARY);
    setSummary(result);
  }, [days]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const isUp = summary.totalUnrealizedPnl >= 0;
  const pnlColor = isUp ? colors.positive : colors.negative;
  const sign = isUp ? '+' : '';

  const isRealizedUp = summary.totalRealizedPnl >= 0;
  const realizedColor = isRealizedUp ? colors.positive : colors.negative;
  const realizedSign = isRealizedUp ? '+' : '';

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={summary.positions}
        keyExtractor={(item) => item.asset}
        renderItem={({ item }) => <PositionCard item={item} />}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t('portfolio.totalValue')}</Text>
            <Text style={styles.summaryValue}>${formatMoney(summary.totalValue)}</Text>
            <View style={styles.pnlRow}>
              <Text style={[styles.summaryPnl, { color: pnlColor }]}>
                {sign}${formatMoney(Math.abs(summary.totalUnrealizedPnl))}
              </Text>
              <Text style={[styles.summaryPnlPercent, { color: pnlColor }]}>
                {sign}
                {summary.totalUnrealizedPnlPercent.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.extraStats}>
              <View style={styles.extraStatsRow}>
                <Text style={styles.summaryLabel}>{t('portfolio.openPositions')}</Text>
                <Text style={styles.extraStatsValue}>{summary.positions.length}</Text>
              </View>
              <View style={[styles.extraStatsRow, styles.extraStatsRowSpacing]}>
                <Text style={styles.summaryLabel}>{t('portfolio.realizedPnl')}</Text>
                <Text style={[styles.extraStatsValue, { color: realizedColor }]}>
                  {realizedSign}${formatMoney(Math.abs(summary.totalRealizedPnl))}
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('portfolio.empty')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function formatMoney(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loader: {
      marginTop: 24,
    },
    list: {
      paddingBottom: 24,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      margin: 16,
    },
    summaryLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    summaryValue: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '800',
      marginTop: 6,
    },
    pnlRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 10,
      marginTop: 8,
    },
    summaryPnl: {
      fontSize: 18,
      fontWeight: '800',
    },
    summaryPnlPercent: {
      fontSize: 15,
      fontWeight: '700',
    },
    extraStats: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    extraStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    extraStatsRowSpacing: {
      marginTop: 10,
    },
    extraStatsValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 32,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
    },
  });
