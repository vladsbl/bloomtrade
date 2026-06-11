import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { ImpactLevel } from '../types/news';

const IMPACT_BADGE: Record<ImpactLevel, { emoji: string; label: string; color: string }> = {
  high: { emoji: '🔴', label: 'High', color: colors.negative },
  medium: { emoji: '🟡', label: 'Medium', color: colors.warning },
  low: { emoji: '🟢', label: 'Low', color: colors.positive },
};

export default function ImpactBadge({ level, score }: { level: ImpactLevel; score: number }) {
  const badge = IMPACT_BADGE[level];

  return (
    <View style={[styles.badge, { borderColor: badge.color }]}>
      <Text style={styles.text}>
        {badge.emoji} {badge.label} · {score}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
