import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../store/theme';
import { ColorPalette } from '../../theme/palettes';
import { TradingInsight } from '../../types/analytics';

const TONE_ICON: Record<TradingInsight['tone'], keyof typeof Ionicons.glyphMap> = {
  positive: 'trending-up',
  negative: 'trending-down',
  neutral: 'information-circle-outline',
};

/** A single auto-generated observation with a tone-colored accent. */
export default function InsightCard({ insight }: { insight: TradingInsight }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const tone =
    insight.tone === 'positive'
      ? colors.positive
      : insight.tone === 'negative'
        ? colors.negative
        : colors.primary;

  return (
    <View style={[styles.row, { borderLeftColor: tone }]}>
      <Ionicons name={TONE_ICON[insight.tone]} size={18} color={tone} style={styles.icon} />
      <Text style={styles.text}>{insight.text}</Text>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 3,
      paddingVertical: 11,
      paddingHorizontal: 12,
      marginBottom: 8,
    },
    icon: {
      marginTop: 1,
    },
    text: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      lineHeight: 18,
    },
  });
