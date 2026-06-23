import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useLanguage } from '../../store/i18n';
import { useTheme } from '../../store/theme';
import { ColorPalette } from '../../theme/palettes';
import { TranslationKey } from '../../store/translations';
import { TradingScore } from '../../types/analytics';

const SIZE = 132;
const STROKE = 12;

interface Breakdown {
  labelKey: TranslationKey;
  value: number;
  max: number;
}

/** Big overall score ring plus the four weighted sub-scores. */
export default function ScoreCard({ score }: { score: TradingScore }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, score.score / 100));
  const ringColor =
    score.score >= 70 ? colors.positive : score.score >= 40 ? colors.warning : colors.negative;

  const breakdown: Breakdown[] = [
    { labelKey: 'analytics.score.performance', value: score.performanceScore, max: 40 },
    { labelKey: 'analytics.score.risk', value: score.riskScore, max: 30 },
    { labelKey: 'analytics.score.consistency', value: score.consistencyScore, max: 20 },
    { labelKey: 'analytics.score.discipline', value: score.disciplineScore, max: 10 },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={radius} stroke={colors.surfaceAlt} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.ringCenter} pointerEvents="none">
          <Text style={[styles.scoreValue, { color: ringColor }]}>{score.score}</Text>
          <Text style={styles.scoreOutOf}>{t('analytics.score.outOf')}</Text>
        </View>
      </View>

      <View style={styles.breakdown}>
        {breakdown.map((item) => {
          const ratio = item.max > 0 ? Math.max(0, Math.min(1, item.value / item.max)) : 0;
          return (
            <View key={item.labelKey} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{t(item.labelKey)}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: ringColor }]} />
              </View>
              <Text style={styles.breakdownValue}>
                {item.value}/{item.max}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 14,
    },
    ringWrap: {
      width: SIZE,
      height: SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringCenter: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreValue: {
      fontSize: 40,
      fontWeight: '800',
    },
    scoreOutOf: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
      marginTop: -2,
    },
    breakdown: {
      flex: 1,
      gap: 8,
    },
    breakdownRow: {
      gap: 4,
    },
    breakdownLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
    },
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.surfaceAlt,
      overflow: 'hidden',
    },
    fill: {
      height: 6,
      borderRadius: 3,
    },
    breakdownValue: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '700',
      alignSelf: 'flex-end',
    },
  });
