import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnalyticsCard from '../components/analytics/AnalyticsCard';
import InsightCard from '../components/analytics/InsightCard';
import MetricCard from '../components/analytics/MetricCard';
import PerformanceChart, { ChartDatum } from '../components/analytics/PerformanceChart';
import ScoreCard from '../components/analytics/ScoreCard';
import { useOpenPositions } from '../hooks/useOpenPositions';
import { bucketLabel } from '../services/analyticsLabels';
import { buildAnalytics } from '../services/tradingAnalyticsService';
import { generateInsights } from '../services/tradingInsightsService';
import { useCurrency } from '../store/currency';
import { useLanguage } from '../store/i18n';
import { useJournalByDate } from '../store/journalByDate';
import { useTheme } from '../store/theme';
import { TranslationKey } from '../store/translations';
import { AssetPerf, DirectionStats, InsightTone, TimeStats } from '../types/analytics';
import { ColorPalette } from '../theme/palettes';

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { formatBase } = useCurrency();
  const { days, loading } = useJournalByDate();
  const { summary } = useOpenPositions(); // live unrealized P&L
  const styles = createStyles(colors);

  const report = useMemo(
    () => buildAnalytics(days, summary.initialCapital),
    [days, summary.initialCapital]
  );

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
    { label: t('analytics.metric.bestTrade'), value: money(general.bestTrade), tone: 'positive' },
    { label: t('analytics.metric.worstTrade'), value: money(general.worstTrade), tone: 'negative' },
    { label: t('analytics.metric.unrealizedPnl'), value: money(summary.unrealizedPnl), tone: toneOf(summary.unrealizedPnl) },
    { label: t('analytics.metric.maxDrawdown'), value: money(-risk.maxDrawdown), tone: 'negative' },
    { label: t('analytics.metric.resultsVolatility'), value: money(risk.resultsVolatility) },
    { label: t('analytics.metric.avgRisk'), value: money(risk.averageRisk) },
    { label: t('analytics.metric.bestStreak'), value: String(risk.bestWinStreak), tone: 'positive' },
    { label: t('analytics.metric.worstStreak'), value: String(risk.worstLossStreak), tone: 'negative' },
    { label: t('analytics.metric.payoff'), value: ratio(risk.payoffRatio) },
    { label: t('analytics.metric.recovery'), value: ratio(risk.recoveryFactor) },
  ];

  const weekdayData: ChartDatum[] = time.byWeekday.map((b) => ({
    label: bucketLabel('weekday', b.key, t),
    value: b.netPnl,
  }));
  const weekData: ChartDatum[] = time.byWeek.map((b) => ({
    label: bucketLabel('week', b.key, t),
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
  const assetDistData: ChartDatum[] = report.assets
    .filter((asset) => asset.closedTrades > 0)
    .slice(0, 8)
    .map((asset) => ({ label: asset.symbol, value: asset.netPnl }));
  const histogramData: ChartDatum[] = report.pnlHistogram.map((bin) => ({
    label: '',
    value: bin.count,
    color: bin.isWin ? colors.positive : colors.negative,
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

            {/* Long / Short breakdown */}
            <Text style={styles.sectionTitle}>{t('analytics.longShort')}</Text>
            <AnalyticsCard>
              <View style={styles.directionRow}>
                <DirectionColumn stats={report.long} colors={colors} money={money} percent={percent} ratio={ratio} t={t} />
                <View style={styles.directionDivider} />
                <DirectionColumn stats={report.short} colors={colors} money={money} percent={percent} ratio={ratio} t={t} />
              </View>
            </AnalyticsCard>

            {/* 3 & 4. Best / worst assets */}
            <Text style={styles.sectionTitle}>{t('analytics.topAssets')}</Text>
            <AnalyticsCard>
              {topAssets.length > 0 ? (
                topAssets.map((asset) => (
                  <AssetRow key={asset.symbol} asset={asset} colors={colors} money={money} percent={percent} duration={duration} t={t} />
                ))
              ) : (
                <Text style={styles.noticeText}>{t('analytics.noRanking')}</Text>
              )}
            </AnalyticsCard>

            <Text style={styles.sectionTitle}>{t('analytics.worstAssets')}</Text>
            <AnalyticsCard>
              {worstAssets.length > 0 ? (
                worstAssets.map((asset) => (
                  <AssetRow key={asset.symbol} asset={asset} colors={colors} money={money} percent={percent} duration={duration} t={t} />
                ))
              ) : (
                <Text style={styles.noticeText}>{t('analytics.noRanking')}</Text>
              )}
            </AnalyticsCard>

            {/* 5. Temporal analysis */}
            <Text style={styles.sectionTitle}>{t('analytics.temporal')}</Text>
            <RankingsCard time={time} colors={colors} money={money} t={t} />
            <AnalyticsCard title={t('analytics.temporal.byWeekday')}>
              <PerformanceChart data={weekdayData} variant="bars" />
            </AnalyticsCard>
            {weekData.length > 0 && (
              <AnalyticsCard title={t('analytics.temporal.byWeek')}>
                <PerformanceChart data={weekData} variant="bars" />
              </AnalyticsCard>
            )}
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

            {/* 7. Visualizations */}
            <Text style={styles.sectionTitle}>{t('analytics.equityCurve')}</Text>
            <AnalyticsCard>
              <PerformanceChart data={equityData} variant="line" />
            </AnalyticsCard>

            {assetDistData.length > 0 && (
              <AnalyticsCard title={t('analytics.assetDistribution')}>
                <PerformanceChart data={assetDistData} variant="bars" />
              </AnalyticsCard>
            )}

            {histogramData.length > 0 && (
              <AnalyticsCard title={t('analytics.pnlHistogram')}>
                <PerformanceChart data={histogramData} variant="bars" />
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.negative }]} />
                    <Text style={styles.legendText}>{t('analytics.losses')}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.positive }]} />
                    <Text style={styles.legendText}>{t('analytics.gains')}</Text>
                  </View>
                </View>
              </AnalyticsCard>
            )}
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
  duration,
  t,
}: {
  asset: AssetPerf;
  colors: ColorPalette;
  money: (value: number) => string;
  percent: (value: number) => string;
  duration: (ms: number | null) => string;
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
          {asset.averageDurationMs !== null ? ` · ${duration(asset.averageDurationMs)}` : ''}
        </Text>
      </View>
      <Text style={[styles.assetPnl, { color: pnlColor }]}>{money(asset.netPnl)}</Text>
    </View>
  );
}

function RankingsCard({
  time,
  colors,
  money,
  t,
}: {
  time: TimeStats;
  colors: ColorPalette;
  money: (value: number) => string;
  t: (key: TranslationKey) => string;
}) {
  const styles = createStyles(colors);
  const items: { label: string; name: string; pnl: number; tone: InsightTone }[] = [];
  if (time.bestDay)
    items.push({ label: t('analytics.temporal.bestDay'), name: bucketLabel('weekday', time.bestDay.key, t), pnl: time.bestDay.netPnl, tone: 'positive' });
  if (time.worstDay)
    items.push({ label: t('analytics.temporal.worstDay'), name: bucketLabel('weekday', time.worstDay.key, t), pnl: time.worstDay.netPnl, tone: 'negative' });
  if (time.bestHour)
    items.push({ label: t('analytics.temporal.bestHour'), name: bucketLabel('hour', time.bestHour.key, t), pnl: time.bestHour.netPnl, tone: 'positive' });
  if (time.worstHour)
    items.push({ label: t('analytics.temporal.worstHour'), name: bucketLabel('hour', time.worstHour.key, t), pnl: time.worstHour.netPnl, tone: 'negative' });

  if (items.length === 0) return null;

  return (
    <AnalyticsCard title={t('analytics.rankings')}>
      <View style={styles.grid}>
        {items.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.name} hint={money(item.pnl)} tone={item.tone} />
        ))}
      </View>
    </AnalyticsCard>
  );
}

function DirectionColumn({
  stats,
  colors,
  money,
  percent,
  ratio,
  t,
}: {
  stats: DirectionStats;
  colors: ColorPalette;
  money: (value: number) => string;
  percent: (value: number) => string;
  ratio: (value: number) => string;
  t: (key: TranslationKey) => string;
}) {
  const styles = createStyles(colors);
  const pnlColor = stats.netPnl >= 0 ? colors.positive : colors.negative;
  const rows: { label: string; value: string; color?: string }[] = [
    { label: t('analytics.metric.closedTrades'), value: String(stats.closedTrades) },
    { label: t('analytics.metric.netPnl'), value: money(stats.netPnl), color: pnlColor },
    { label: t('analytics.metric.winRate'), value: percent(stats.winRate) },
    { label: t('analytics.metric.profitFactor'), value: ratio(stats.profitFactor) },
  ];
  return (
    <View style={styles.directionCol}>
      <Text style={[styles.directionTitle, { color: stats.direction === 'LONG' ? colors.positive : colors.negative }]}>
        {stats.direction === 'LONG' ? t('trade.long') : t('trade.short')}
      </Text>
      {rows.map((row) => (
        <View key={row.label} style={styles.dirRow}>
          <Text style={styles.dirLabel}>{row.label}</Text>
          <Text style={[styles.dirValue, !!row.color && { color: row.color }]}>{row.value}</Text>
        </View>
      ))}
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
    directionRow: {
      flexDirection: 'row',
    },
    directionCol: {
      flex: 1,
      paddingHorizontal: 6,
    },
    directionDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    directionTitle: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    dirRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 5,
    },
    dirLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '600',
      flexShrink: 1,
      marginRight: 8,
    },
    dirValue: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 18,
      marginTop: 8,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
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
