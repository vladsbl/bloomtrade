import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MarketAnalysisOutput, MarketBias } from '../../services/aiMarketAnalyst/types';
import { useCurrency } from '../../store/currency';
import { useLanguage } from '../../store/i18n';
import { useTheme } from '../../store/theme';
import { TranslationKey } from '../../store/translations';
import { ColorPalette } from '../../theme/palettes';

interface AnalysisReportProps {
  report: MarketAnalysisOutput;
  onRerun: () => void;
}

const TIMEFRAME_LABEL: Record<MarketAnalysisOutput['timeframe'], TranslationKey> = {
  intraday: 'ai.timeframe.intraday',
  swing: 'ai.timeframe.swing',
  position: 'ai.timeframe.position',
};

export default function AnalysisReport({ report, onRerun }: AnalysisReportProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const styles = createStyles(colors);

  const fmt = (value: number) => formatPrice(value, report.asset);
  const biasColor = (bias: MarketBias) =>
    bias === 'bullish' ? colors.positive : bias === 'bearish' ? colors.negative : colors.textSecondary;
  const biasLabel = (bias: MarketBias) =>
    t(bias === 'bullish' ? 'ai.gen.biasBullish' : bias === 'bearish' ? 'ai.gen.biasBearish' : 'ai.gen.biasNeutral');

  const summary = report.executiveSummary;

  return (
    <View>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.asset}>{report.asset}</Text>
            <Text style={styles.assetName}>{report.assetName}</Text>
          </View>
          <View style={styles.timeframeChip}>
            <Text style={styles.timeframeText}>{t(TIMEFRAME_LABEL[report.timeframe])}</Text>
          </View>
        </View>
        <View style={styles.headerMeta}>
          <View style={[styles.biasBadge, { backgroundColor: `${biasColor(summary.bias)}22`, borderColor: biasColor(summary.bias) }]}>
            <Text style={[styles.biasText, { color: biasColor(summary.bias) }]}>{biasLabel(summary.bias)}</Text>
          </View>
          <Text style={styles.conviction}>
            {t('ai.report.conviction')} {summary.conviction}/100
          </Text>
          <Text style={styles.sourceBadge}>{report.source === 'llm' ? 'AI' : t('ai.report.localEngine')}</Text>
        </View>
      </View>

      {/* 1. Executive summary */}
      <Section title={t('ai.report.executiveSummary')} colors={colors}>
        <Text style={styles.headline}>{summary.headline}</Text>
        <Text style={styles.body}>{summary.text}</Text>
      </Section>

      {/* 2. Market structure */}
      <Section title={t('ai.report.marketStructure')} colors={colors}>
        <Text style={styles.body}>{report.marketStructure.description}</Text>
        <MetaLine label={t('ai.report.volatility')} value={report.marketStructure.volatilityRegime} colors={colors} />
        <MetaLine label={t('ai.report.momentum')} value={report.marketStructure.momentum} colors={colors} />
      </Section>

      {/* 3. Key levels */}
      {report.keyLevels.length > 0 && (
        <Section title={t('ai.report.keyLevels')} colors={colors}>
          {report.keyLevels.map((level, i) => {
            const color =
              level.kind === 'resistance' ? colors.negative : level.kind === 'support' ? colors.positive : colors.primary;
            return (
              <View key={`${level.kind}-${i}`} style={styles.levelRow}>
                <View style={[styles.levelDot, { backgroundColor: color }]} />
                <Text style={styles.levelKind}>{t(`ai.report.level.${level.kind}` as TranslationKey)}</Text>
                <Text style={styles.levelPrice}>{fmt(level.price)}</Text>
              </View>
            );
          })}
        </Section>
      )}

      {/* 4. Scenarios */}
      <Section title={t('ai.report.scenarios')} colors={colors}>
        {report.scenarios.map((scenario) => (
          <View key={scenario.id} style={styles.scenarioCard}>
            <View style={styles.scenarioHead}>
              <Text style={styles.scenarioName}>{scenario.name}</Text>
              <Text style={[styles.scenarioProb, { color: biasColor(scenario.bias) }]}>{scenario.probability}%</Text>
            </View>
            <View style={styles.probTrack}>
              <View
                style={[styles.probFill, { width: `${scenario.probability}%`, backgroundColor: biasColor(scenario.bias) }]}
              />
            </View>
            <Text style={styles.scenarioTrigger}>{scenario.trigger}</Text>
            <View style={styles.scenarioLevels}>
              {scenario.target !== null && (
                <Text style={styles.scenarioMeta}>
                  {t('ai.report.target')}: <Text style={{ color: colors.text }}>{fmt(scenario.target)}</Text>
                </Text>
              )}
              {scenario.invalidation !== null && (
                <Text style={styles.scenarioMeta}>
                  {t('ai.report.invalidation')}: <Text style={{ color: colors.text }}>{fmt(scenario.invalidation)}</Text>
                </Text>
              )}
            </View>
            <Text style={styles.scenarioRationale}>{scenario.rationale}</Text>
          </View>
        ))}
      </Section>

      {/* 5. Trade plan */}
      <Section title={t('ai.report.tradePlan')} colors={colors}>
        {report.tradePlan.map((step, i) => (
          <View key={i} style={styles.planRow}>
            <Text style={styles.planIndex}>{i + 1}</Text>
            <Text style={styles.body}>{step}</Text>
          </View>
        ))}
      </Section>

      {/* 6. Risk management */}
      <Section title={t('ai.report.riskManagement')} colors={colors}>
        <View style={styles.riskGrid}>
          <RiskTile label={t('ai.report.riskReward')} value={`1:${report.riskModel.suggestedRiskReward}`} colors={colors} />
          <RiskTile
            label={t('ai.report.stopDistance')}
            value={report.riskModel.stopDistancePercent !== null ? `${report.riskModel.stopDistancePercent}%` : '—'}
            colors={colors}
          />
        </View>
        <Text style={styles.body}>{report.riskModel.positionSizingNote}</Text>
        <Text style={styles.muted}>{report.riskModel.maxRiskNote}</Text>
      </Section>

      {/* 7. Invalidation */}
      {report.invalidation.length > 0 && (
        <Section title={t('ai.report.invalidationRules')} colors={colors}>
          {report.invalidation.map((rule, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.warning} style={styles.bulletIcon} />
              <Text style={styles.body}>{rule}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* Macro context */}
      <Section title={t('ai.report.macroContext')} colors={colors}>
        <Text style={styles.body}>{report.macroContext}</Text>
      </Section>

      <Text style={styles.disclaimer}>{t('ai.disclaimer')}</Text>

      <Pressable style={styles.rerun} onPress={onRerun}>
        <Ionicons name="refresh" size={16} color={colors.primary} />
        <Text style={styles.rerunText}>{t('ai.report.regenerate')}</Text>
      </Pressable>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: ReactNode; colors: ColorPalette }) {
  const styles = createStyles(colors);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MetaLine({ label, value, colors }: { label: string; value: string; colors: ColorPalette }) {
  const styles = createStyles(colors);
  return (
    <View style={styles.metaLine}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function RiskTile({ label, value, colors }: { label: string; value: string; colors: ColorPalette }) {
  const styles = createStyles(colors);
  return (
    <View style={styles.riskTile}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.riskValue}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    headerCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 14,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    asset: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
    },
    assetName: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    timeframeChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeframeText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
    headerMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 14,
    },
    biasBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
    },
    biasText: {
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    conviction: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      flex: 1,
    },
    sourceBadge: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 14,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    headline: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 6,
      lineHeight: 20,
    },
    body: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
      flex: 1,
    },
    muted: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 6,
    },
    metaLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    metaLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    metaValue: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
      flexShrink: 1,
      textAlign: 'right',
      marginLeft: 12,
    },
    levelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 7,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    levelDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    levelKind: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
    },
    levelPrice: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    scenarioCard: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 10,
    },
    scenarioHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    scenarioName: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
      flex: 1,
    },
    scenarioProb: {
      fontSize: 16,
      fontWeight: '800',
    },
    probTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: 'hidden',
      marginTop: 8,
      marginBottom: 8,
    },
    probFill: {
      height: 5,
      borderRadius: 3,
    },
    scenarioTrigger: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 18,
    },
    scenarioLevels: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginTop: 6,
    },
    scenarioMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    scenarioRationale: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 6,
    },
    planRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    planIndex: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '800',
      width: 18,
    },
    riskGrid: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    riskTile: {
      flex: 1,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
    },
    riskValue: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginTop: 4,
    },
    bulletRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    bulletIcon: {
      marginTop: 1,
    },
    disclaimer: {
      color: colors.textSecondary,
      fontSize: 11,
      lineHeight: 16,
      fontStyle: 'italic',
      textAlign: 'center',
      marginBottom: 14,
    },
    rerun: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    rerunText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '800',
    },
  });
