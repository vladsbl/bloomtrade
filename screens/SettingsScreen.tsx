import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsStackParamList } from '../navigation/SettingsStack';
import { LEVERAGE_OPTIONS } from '../services/portfolioAccountingService';
import { useCurrency } from '../store/currency';
import { Language, useLanguage } from '../store/i18n';
import { ThemeMode, useTheme } from '../store/theme';
import { useTradingAccount } from '../store/tradingAccount';
import { Currency, CURRENCY_SYMBOLS } from '../types/currency';
import { ColorPalette } from '../theme/palettes';

type SettingsNavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

export default function SettingsScreen() {
  const { colors, mode, setTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const navigation = useNavigation<SettingsNavigationProp>();
  const {
    initialCapital,
    leverage,
    accountCurrency,
    updateCapital,
    updateLeverage,
    updateAccountCurrency,
  } = useTradingAccount();
  const styles = createStyles(colors);

  // Local draft so the field stays editable while typing; commit valid numbers.
  const [capitalDraft, setCapitalDraft] = useState(String(initialCapital));
  useEffect(() => {
    setCapitalDraft(String(initialCapital));
  }, [initialCapital]);

  const onCapitalChange = (text: string) => {
    setCapitalDraft(text);
    const value = parseFloat(text.replace(',', '.'));
    if (Number.isFinite(value) && value >= 0) updateCapital(value);
  };

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'dark', label: t('settings.dark') },
    { value: 'light', label: t('settings.light') },
  ];

  const languageOptions: { value: Language; label: string }[] = [
    { value: 'fr', label: t('settings.french') },
    { value: 'en', label: t('settings.english') },
  ];

  const currencyOptions: { value: Currency; label: string }[] = [
    { value: 'USD', label: t('settings.currencyUsd') },
    { value: 'EUR', label: t('settings.currencyEur') },
  ];

  const accountCurrencyOptions: { value: Currency; label: string }[] = [
    { value: 'USD', label: `${CURRENCY_SYMBOLS.USD} USD` },
    { value: 'EUR', label: `${CURRENCY_SYMBOLS.EUR} EUR` },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <Pressable
          style={styles.bellButton}
          onPress={() => navigation.navigate('Alerts')}
          hitSlop={8}
          accessibilityLabel={t('alerts.title')}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.currency')}</Text>
          <View style={styles.optionRow}>
            {currencyOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.option, currency === option.value && styles.optionActive]}
                onPress={() => setCurrency(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    currency === option.value && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.tradingAccount')}</Text>

          <Text style={styles.fieldLabel}>
            {t('settings.initialCapital')} ({CURRENCY_SYMBOLS[accountCurrency]})
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={capitalDraft}
            onChangeText={onCapitalChange}
            placeholder="10000"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>
            {t('settings.accountCurrency')}
          </Text>
          <View style={styles.optionRow}>
            {accountCurrencyOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.option, accountCurrency === option.value && styles.optionActive]}
                onPress={() => updateAccountCurrency(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    accountCurrency === option.value && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>{t('settings.leverage')}</Text>
          <View style={styles.chipsRow}>
            {LEVERAGE_OPTIONS.map((value) => (
              <Pressable
                key={value}
                style={[styles.chip, leverage === value && styles.optionActive]}
                onPress={() => updateLeverage(value)}
              >
                <Text style={[styles.chipText, leverage === value && styles.optionTextActive]}>
                  x{value}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
    },
    bellButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
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
    fieldLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 8,
    },
    fieldLabelSpaced: {
      marginTop: 16,
    },
    input: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 11,
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    chipText: {
      color: colors.textSecondary,
      fontWeight: '700',
      fontSize: 13,
    },
  });
