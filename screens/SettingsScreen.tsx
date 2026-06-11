import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Language, useLanguage } from '../store/i18n';
import { ThemeMode, useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';

export default function SettingsScreen() {
  const { colors, mode, setTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const styles = createStyles(colors);

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'dark', label: t('settings.dark') },
    { value: 'light', label: t('settings.light') },
  ];

  const languageOptions: { value: Language; label: string }[] = [
    { value: 'fr', label: t('settings.french') },
    { value: 'en', label: t('settings.english') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.theme')}</Text>
          <View style={styles.optionRow}>
            {themeOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.option, mode === option.value && styles.optionActive]}
                onPress={() => setTheme(option.value)}
              >
                <Text
                  style={[styles.optionText, mode === option.value && styles.optionTextActive]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <View style={styles.optionRow}>
            {languageOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.option, language === option.value && styles.optionActive]}
                onPress={() => setLanguage(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    language === option.value && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 16,
    },
    sectionTitle: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    optionRow: {
      flexDirection: 'row',
      gap: 8,
    },
    option: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    optionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionText: {
      color: colors.textSecondary,
      fontWeight: '600',
    },
    optionTextActive: {
      color: '#fff',
    },
  });
