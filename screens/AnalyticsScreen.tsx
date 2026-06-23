import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnalyticsCard from '../components/analytics/AnalyticsCard';
import InsightCard from '../components/analytics/InsightCard';
import MetricCard from '../components/analytics/MetricCard';
import PerformanceChart, { ChartDatum } from '../components/analytics/PerformanceChart';
import ScoreCard from '../components/analytics/ScoreCard';
import { bucketLabel } from '../services/analyticsLabels';
import { buildAnalytics } from '../services/tradingAnalyticsService';
import { generateInsights } from '../services/tradingInsightsService';
import { useCurrency } from '../store/currency';
import { useLanguage } from '../store/i18n';
import { useJournalByDate } from '../store/journalByDate';
import { useTheme } from '../store/theme';
import { TranslationKey } from '../store/translations';
import { AssetPerf, InsightTone } from '../types/analytics';
import { ColorPalette } from '../theme/palettes';

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { formatBase } = useCurrency();
  const { days, loading } = useJournalByDate();
  const styles = createStyles(colors);

  const report = useMemo(() => buildAnalytics(days), [days]);

  // Sign-aware money + helpers (formatBase keeps amounts in the display currency).
  const money = (value: number) => `${value < 0 ? '-' : ''}${formatBase(Math.abs(value))}`;
  const percent = (value: number) => `${value.toFixed(1)}%`;
  const ratio = (value: number) => (Number.isFinite(value) ? value.toFixed(2) : '∞');
  const toneOf = (value: number): InsightTone =>
    value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
  const duration = (ms: number | null) => formatDuration(ms, t);

  const insights = useMemo(() => generateInsights(report, t, money), [report, t, formatBase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!report.hasTrades) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <EmptyState
          icon="stats-chart-outline"
          title={t('analytics.empty')}
          hint={t('analytics.emptyHint')}
          colors={colors}
        />
      </SafeAreaView>
    );
  }

  const { general, risk, time, topAssets, worstAssets } = report;

  const summaryMetrics = [
    { label: t('analytics.metric.netPnl'), value: money(general.netPnl), tone: toneOf(general.netPnl) },
    { label: t('analytics.metric.winRate'), value: percent(general.winRate) },
    { label: t('analytics.metric.profitFactor'), value: ratio(general.profitFactor) },
  ];

  const detailedMetrics: { label: string; value: string; tone?: InsightTone }[] = [
    { label: t('analytics.metric.closedTrades'), value: String(general.closedTrades) },
    { label: t('analytics.metric.openTrades'), value: String(general.openTrades) },
    { label: t('analytics.metric.winners'), value: String(general.winningTrades), tone: 'positive' },
    { label: t('analytics.metric.losers'), value: String(general.losingTrades), tone: 'negative' },
    { label: t('analytics.metric.avgWin'), value: money(general.averageWin), tone: 'positive' },
    { label: t('analytics.metric.avgLoss'), value: money(-general.averageLoss), tone: 'negative' },
    { label: t('analytics.metric.grossProfit'), value: money(general.grossProfit), tone: 'positive' },
    { label: t('analytics.metric.grossLoss'), value: money(-general.grossLoss), tone: 'negative' },
    { label: t('analytics.metric.expectancy'), value: money(general.expectancy), tone: toneOf(general.expectancy) },
    { label: t('analytics.metric.maxDrawdown'), value: money(-risk.maxDrawdown), tone: 'negative' },
    { label: t('analytics.metric.bestStreak'), value: String(risk.bestWinStreak), tone: 'positive' },
    { label: t('analytics.metric.worstStreak'), value: String(risk.worstLossStreak), tone: 'negative' },
    { label: t('analytics.metric.payoff'), value: ratio(risk.payoffRatio) },
    { label: t('analytics.metric.recovery'), value: ratio(risk.recoveryFactor) },
  ];

  const weekdayData: ChartDatum[] = time.byWeekday.map((b) => ({
    label: bucketLabel('weekday', b.key, t),
    value: b.netPnl,
  }));
  const monthData: ChartDatum[] = time.byMonth.map((b) => ({
    label: bucketLabel('month', b.key, t),
    value: b.netPnl,
  }));
  const hourData: ChartDatum[] = time.byHour.map((b) => ({
    label: bucketLabel('hour', b.key, t),
    value: b.netPnl,
  }));
  const equityData: ChartDatum[] = report.equityCurve.map((point) => ({
    label: '',
    value: point.value,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. Summary */}
        <Text style={styles.sectionTitle}>{t('analytics.summary')}</Text>
        <ScoreCard score={report.score} />
        <View style={styles.grid}>
          {summaryMetrics.map((metric) => (
            <MetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
          ))}
        </View>

        {!report.hasData && (
          <AnalyticsCard>
            <Text style={styles.noticeText}>{t('analytics.needClosed')}</Text>
          </AnalyticsCard>
        )}

        {report.hasData && (
          <>
            {/* 2. Detailed stats */}
            <Text style={styles.sectionTitle}>{t('analytics.detailedStats')}</Text>
            <AnalyticsCard>
              <View style={styles.grid}>
                {detailedMetrics.map((metric) => (
                  <MetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
                ))}
              </View>
            </AnalyticsCard>

            {/* 3 & 4. Best / worst assets */}
            <Text style={styles.sectionTitle}>{t('analytics.topAssets')}</Text>
            <AnalyticsCard>
              {topAssets.length > 0 ? (
                topAssets.map((asset) => (
                  <AssetRow key={asset.symbol} asset={asset} colors={colors} money={money} percent={percent} t={t} />
                ))
              ) : (
                <Text style={styles.noticeText}>{t('analytics.noRanking')}</Text>
              )}
            </AnalyticsCard>

            <Text style={styles.sectionTitle}>{t('analytics.worstAssets')}</Text>
            <AnalyticsCard>
              {worstAssets.length > 0 ? (
                worstAssets.map((asset) => (
                  <AssetRow key={asset.symbol} asset={asset} colors={colors} money={money} percent={percent} t={t} />
                ))
              ) : (
                <Text style={styles.noticeText}>{t('analytics.noRanking')}</Text>
              )}
            </AnalyticsCard>

            {/* 5. Temporal analysis */}
            <Text style={styles.sectionTitle}>{t('analytics.temporal')}</Text>
            <AnalyticsCard title={t('analytics.temporal.byWeekday')}>
              <PerformanceChart data={weekdayData} variant="bars" />
            </AnalyticsCard>
            {monthData.length > 0 && (
              <AnalyticsCard title={t('analytics.temporal.byMonth')}>
                <PerformanceChart data={monthData} variant="bars" />
              </AnalyticsCard>
            )}
            {hourData.length > 0 && (
              <AnalyticsCard title={t('analytics.temporal.byHour')}>
                <PerformanceChart data={hourData} variant="bars" />
              </AnalyticsCard>
            )}
            <AnalyticsCard title={t('analytics.temporal.duration')}>
              {time.duration.available ? (
                <View style={styles.grid}>
                  <MetricCard
                    label={t('analytics.temporal.avgWinDuration')}
                    value={duration(time.duration.averageWinningMs)}
                    tone="positive"
                  />
                  <MetricCard
                    label={t('analytics.temporal.avgLossDuration')}
                    value={duration(time.duration.averageLosingMs)}
                    tone="negative"
                  />
                </View>
              ) : (
                <Text style={styles.noticeText}>{t('analytics.temporal.durationUnavailable')}</Text>
              )}
            </AnalyticsCard>

            {/* 7. Equity curve */}
            <Text style={styles.sectionTitle}>{t('analytics.equityCurve')}</Text>
            <AnalyticsCard>
              <PerformanceChart data={equityData} variant="line" />
            </AnalyticsCard>
          </>
        )}

        {/* 6. Insights */}
        <Text style={styles.sectionTitle}>{t('analytics.insights')}</Text>
        {insights.length > 0 ? (
          insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)
        ) : (
          <AnalyticsCard>
            <Text style={styles.noticeText}>{t('analytics.noInsights')}</Text>
          </AnalyticsCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AssetRow({
  asset,
  colors,
  money,
  percent,
  t,
}: {
  asset: AssetPerf;
  colors: ColorPalette;
  money: (value: number) => string;
  percent: (value: number) => string;
  t: (key: TranslationKey) => string;
}) {
  const styles = createStyles(colors);
  const pnlColor = asset.netPnl >= 0 ? colors.positive : colors.negative;
  return (
    <View style={styles.assetRow}>
      <View style={styles.assetIdentity}>
        <Text style={styles.assetSymbol}>{asset.symbol}</Text>
        <Text style={styles.assetMeta}>
          {asset.closedTrades} {t('analytics.asset.trades')} · {percent(asset.winRate)}{' '}
          {t('analytics.asset.winRate')}
        </Text>
      </View>
      <Text style={[styles.assetPnl, { color: pnlColor }]}>{money(asset.netPnl)}</Text>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  hint,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint: string;
  colors: ColorPalette;
}) {
  const styles = createStyles(colors);
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={42} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyHint}>{hint}</Text>
    </View>
  );
}

function formatDuration(ms: number | null, t: (key: TranslationKey) => string): string {
  if (ms === null || !Number.isFinite(ms)) return '—';
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} ${t('analytics.unit.min')}`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} ${t('analytics.unit.h')}`;
  return `${Math.round(hours / 24)} ${t('analytics.unit.d')}`;
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
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
      marginTop: 6,
      marginBottom: 12,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14,
    },
    noticeText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    assetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 9,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    assetIdentity: {
      flex: 1,
      marginRight: 12,
    },
    assetSymbol: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    assetMeta: {
      color: colors.textSecondary,
      fontSize: 11,
      marginTop: 2,
    },
    assetPnl: {
      fontSize: 14,
      fontWeight: '800',
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      gap: 8,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
      textAlign: 'center',
      marginTop: 6,
    },
    emptyHint: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 19,
    },
  });
