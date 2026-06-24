import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnalysisLoader from '../components/aiAnalyst/AnalysisLoader';
import AnalysisReport from '../components/aiAnalyst/AnalysisReport';
import { TradesStackParamList } from '../navigation/TradesStack';
import { runAnalysis } from '../services/aiMarketAnalyst/aiMarketAnalystService';
import { MarketAnalysisOutput } from '../services/aiMarketAnalyst/types';
import { useCurrency } from '../store/currency';
import { useLanguage } from '../store/i18n';
import { useJournalByDate } from '../store/journalByDate';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';

type AIAnalysisRouteProp = RouteProp<TradesStackParamList, 'AIAnalysis'>;

// Minimum on-screen analysis time so the premium loader doesn't flash. Tunable
// up to the spec's multi-minute window.
const MIN_ANALYSIS_MS = 8000;

type Phase = 'loading' | 'ready' | 'error';

export default function AIAnalysisScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { days } = useJournalByDate();
  const { params } = useRoute<AIAnalysisRouteProp>();
  const styles = createStyles(colors);

  const { symbol, timeframe } = params;
  const [phase, setPhase] = useState<Phase>('loading');
  const [report, setReport] = useState<MarketAnalysisOutput | null>(null);
  const [run, setRun] = useState({ id: 0, force: false });

  useEffect(() => {
    let active = true;
    setPhase('loading');

    const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_ANALYSIS_MS));
    const analysis = runAnalysis({
      symbol,
      timeframe,
      days,
      t,
      language,
      formatPrice: (value) => formatPrice(value, symbol),
      force: run.force,
    });

    Promise.all([analysis, minDelay])
      .then(([result]) => {
        if (!active) return;
        setReport(result);
        setPhase('ready');
      })
      .catch(() => {
        if (active) setPhase('error');
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe, run]);

  const handleRerun = useCallback(() => {
    setRun((prev) => ({ id: prev.id + 1, force: true }));
  }, []);

  if (phase === 'loading') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AnalysisLoader asset={symbol} />
      </SafeAreaView>
    );
  }

  if (phase === 'error' || !report) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorWrap}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.textSecondary} />
          <Text style={styles.errorTitle}>{t('ai.error.title')}</Text>
          <Text style={styles.errorHint}>{t('ai.error.hint')}</Text>
          <Pressable style={styles.retry} onPress={handleRerun}>
            <Text style={styles.retryText}>{t('ai.error.retry')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <AnalysisReport report={report} onRerun={handleRerun} />
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
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    errorWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      gap: 10,
    },
    errorTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
      marginTop: 6,
    },
    errorHint: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 19,
    },
    retry: {
      marginTop: 10,
      paddingHorizontal: 22,
      paddingVertical: 11,
      borderRadius: 10,
      backgroundColor: colors.primary,
    },
    retryText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '800',
    },
  });
