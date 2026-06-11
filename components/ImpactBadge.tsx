import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { ImpactLevel } from '../types/news';

export default function ImpactBadge({ level, score }: { level: ImpactLevel; score: number }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const IMPACT_BADGE: Record<ImpactLevel, { emoji: string; label: string; color: string }> = {
    high: { emoji: '🔴', label: t('impact.high'), color: colors.negative },
    medium: { emoji: '🟡', label: t('impact.medium'), color: colors.warning },
    low: { emoji: '🟢', label: t('impact.low'), color: colors.positive },
  };

  const badge = IMPACT_BADGE[level];

  return (
    <View style={[styles.badge, { borderColor: badge.color }]}>
      <Text style={styles.text}>
        {badge.emoji} {badge.label} · {score}
      </Text>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    badge: {
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    text: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '600',
    },
  });
