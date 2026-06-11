import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MarketOverviewCard from '../components/MarketOverviewCard';
import SentimentBadge from '../components/SentimentBadge';
import { MarketStackParamList } from '../navigation/MarketStack';
import { generateBrief } from '../services/briefService';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { DailyBrief } from '../types/brief';
import { ColorPalette } from '../theme/palettes';

type BriefNavigationProp = NativeStackNavigationProp<MarketStackParamList, 'Brief'>;

export default function BriefScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const styles = createStyles(colors);
  const navigation = useNavigation<BriefNavigationProp>();

  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateBrief()
      .then(setBrief)
      .catch(() => setBrief(null))
      .finally(() => setLoading(false));
  }, []);

  const dateLabel = useMemo(() => {
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    const label = new Date().toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [language]);

  const watchlistChange = brief?.watchlistChangePercent ?? null;
  const watchlistUp = (watchlistChange ?? 0) >= 0;

  const renderInsights = useCallback(() => {
    if (!brief) return null;
    return (
      <View style={styles.insightCard}>
        <View style={styles.insightRow}>
          <Text style={styles.insightLabel}>{t('brief.globalSentiment')}</Text>
          <SentimentBadge sentiment={brief.globalSentiment} />
        </View>
        <View style={styles.insightRow}>
          <Text style={styles.insightLabel}>{t('brief.watchlistTrend')}</Text>
          <Text
            style={[
              styles.insightValue,
              { color: watchlistChange === null ? colors.textSecondary : watchlistUp ? colors.positive : colors.negative },
            ]}
          >
            {watchlistChange === null
              ? t('market.dataUnavailable')
              : `${watchlistUp ? '+' : ''}${watchlistChange.toFixed(2)}%`}
          </Text>
        </View>
        <View style={styles.insightRow}>
          <Text style={styles.insightLabel}>{t('brief.newsBalance')}</Text>
          <Text style={styles.insightValue}>
            🟢 {brief.sentimentCounts.bullish}  🔴 {brief.sentimentCounts.bearish}  🟡{' '}
            {brief.sentimentCounts.neutral}
          </Text>
        </View>
      </View>
    );
  }, [brief, styles, t, colors, watchlistChange, watchlistUp]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!brief) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('market.error')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>{dateLabel}</Text>

        <Text style={styles.sectionTitle}>{t('brief.marketOverview')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.overviewList}
        >
          {brief.overview.map((item) => (
            <MarketOverviewCard key={item.symbol} item={item} />
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>{t('brief.insights')}</Text>
        {renderInsights()}

        <Text style={styles.sectionTitle}>{t('brief.topNews')}</Text>
        {brief.topNews.length === 0 ? (
          <Text style={styles.emptyText}>{t('market.empty')}</Text>
        ) : (
          brief.topNews.map((item) => (
            <Pressable
              key={item.id}
              style={styles.newsRow}
              onPress={() => navigation.navigate('NewsDetail', { article: item })}
            >
              <View style={styles.newsHeader}>
                <Text style={styles.newsSource}>{item.source}</Text>
                <SentimentBadge sentiment={item.sentiment} />
              </View>
              <Text style={styles.newsTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </Pressable>
          ))
        )}
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
    loader: {
      marginTop: 24,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    date: {
      color: colors.textSecondary,
      fontSize: 13,
      marginBottom: 16,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
      marginTop: 8,
      marginBottom: 12,
    },
    overviewList: {
      paddingRight: 6,
      marginBottom: 12,
    },
    insightCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 12,
    },
    insightRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    insightLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    insightValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    newsRow: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 10,
    },
    newsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    newsSource: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    newsTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
    },
  });
