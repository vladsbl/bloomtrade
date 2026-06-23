import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../store/theme';
import { ColorPalette } from '../../theme/palettes';

interface AnalyticsCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** A titled surface card used to frame every Analytics section. */
export default function AnalyticsCard({ title, subtitle, children, style }: AnalyticsCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.card, style]}>
      {!!title && <Text style={styles.title}>{title}</Text>}
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 14,
    },
    title: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 2,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      marginBottom: 10,
    },
  });
