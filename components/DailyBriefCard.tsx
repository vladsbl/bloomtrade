import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';

export default function DailyBriefCard({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconCircle}>
        <Ionicons name="newspaper-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{t('brief.cardTitle')}</Text>
        <Text style={styles.subtitle}>{t('brief.cardSubtitle')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginHorizontal: 16,
      marginBottom: 24,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
  });
