import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../store/theme';
import { ColorPalette } from '../../theme/palettes';
import { InsightTone } from '../../types/analytics';

interface MetricCardProps {
  label: string;
  value: string;
  tone?: InsightTone; // colors the value (positive/negative/neutral)
  hint?: string;
}

/** A compact metric tile (label + value), used in responsive grids. */
export default function MetricCard({ label, value, tone = 'neutral', hint }: MetricCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const valueColor =
    tone === 'positive' ? colors.positive : tone === 'negative' ? colors.negative : colors.text;

  return (
    <View style={styles.tile}>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[styles.value, { color: valueColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    tile: {
      flexGrow: 1,
      flexBasis: '30%',
      minWidth: 96,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 6,
    },
    value: {
      fontSize: 17,
      fontWeight: '800',
    },
    hint: {
      color: colors.textSecondary,
      fontSize: 10,
      marginTop: 3,
    },
  });
