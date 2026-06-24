import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../store/i18n';
import { useTheme } from '../../store/theme';
import { ColorPalette } from '../../theme/palettes';

interface OpportunityScoreProps {
  score: number; // 0..100
  compact?: boolean; // just the number pill (watchlist rows)
}

function scoreColor(score: number, colors: ColorPalette): string {
  if (score >= 70) return colors.positive;
  if (score >= 40) return colors.warning;
  return colors.textSecondary;
}

/** Color-coded opportunity score badge (green/amber/grey by strength). */
export default function OpportunityScore({ score, compact }: OpportunityScoreProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);
  const color = scoreColor(score, colors);

  return (
    <View
      style={[
        styles.badge,
        compact ? styles.badgeCompact : styles.badgeFull,
        { backgroundColor: `${color}22`, borderColor: `${color}55` },
      ]}
    >
      <Text style={[styles.value, { color }, compact && styles.valueCompact]}>{score}</Text>
      {!compact && <Text style={[styles.label, { color }]}>{t('scanner.score')}</Text>}
    </View>
  );
}

const createStyles = (_colors: ColorPalette) =>
  StyleSheet.create({
    badge: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    badgeCompact: {
      minWidth: 34,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
    },
    badgeFull: {
      width: 56,
      height: 56,
      borderRadius: 12,
    },
    value: {
      fontSize: 20,
      fontWeight: '800',
    },
    valueCompact: {
      fontSize: 14,
    },
    label: {
      fontSize: 9,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginTop: 1,
    },
  });
