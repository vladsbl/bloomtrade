import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../store/i18n';
import { useTheme } from '../../store/theme';
import { ColorPalette } from '../../theme/palettes';

/** Discreet premium entry point to the AI Market Analyst. */
export default function AIAnalystButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  return (
    <Pressable style={styles.button} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Text style={styles.robot}>🤖</Text>
      </View>
      <Text style={styles.label}>{t('ai.button')}</Text>
      <Ionicons name="sparkles" size={14} color={colors.primary} />
    </Pressable>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.surfaceAlt,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    iconWrap: {
      width: 22,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    robot: {
      fontSize: 16,
    },
    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
  });
