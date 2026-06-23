import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImpactBadge from '../components/ImpactBadge';
import SentimentBadge from '../components/SentimentBadge';
import { MarketStackParamList } from '../navigation/MarketStack';
import { detectRelatedAssets } from '../services/assetDetection';
import { getStockQuotes } from '../services/financeApi';
import { expandSummary } from '../services/newsEnhancer';
import { useCurrency } from '../store/currency';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { StockQuote } from '../types/quote';

type NewsDetailRouteProp = RouteProp<MarketStackParamList, 'NewsDetail'>;

export default function NewsDetailScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const styles = createStyles(colors);

  const { params } = useRoute<NewsDetailRouteProp>();
  const { article } = params;

  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  const tickers = detectRelatedAssets(`${article.title} ${article.summary}`);
  const expanded = expandSummary(article);

  useEffect(() => {
    if (tickers.length === 0) {
      setLoadingQuotes(false);
      return;
    }

    setLoadingQuotes(true);
    getStockQuotes(tickers)
      .then(setQuotes)
      .finally(() => setLoadingQuotes(false));
  }, [article.id]);

  const handleOpenSource = () => {
    if (article.url) Linking.openURL(article.url);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.meta}>
          {article.source} · {article.time}
        </Text>
        <Text style={styles.title}>{article.title}</Text>

        <View style={styles.badgeRow}>
          <SentimentBadge sentiment={article.sentiment} />
          <ImpactBadge level={article.impactLevel} score={article.impactScore} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('newsDetail.expandedSummary')}</Text>

          <Text style={styles.summaryLabel}>{t('newsDetail.context')}</Text>
          <Text style={styles.summaryText}>{expanded.context}</Text>

          <Text style={styles.summaryLabel}>{t('newsDetail.summary')}</Text>
          <Text style={styles.summaryText}>{expanded.summary}</Text>

          <Text style={styles.summaryLabel}>{t('newsDetail.marketImpact')}</Text>
          <Text style={styles.summaryText}>{expanded.marketImpact}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('newsDetail.relatedAssets')}</Text>

          {tickers.length === 0 ? (
            <Text style={styles.empty}>{t('newsDetail.noRelatedAssets')}</Text>
          ) : loadingQuotes ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : quotes.length === 0 ? (
            <Text style={styles.empty}>{t('newsDetail.priceUnavailable')}</Text>
          ) : (
            quotes.map((quote) => {
              const isUp = quote.percentChange >= 0;
              return (
                <View key={quote.symbol} style={styles.quoteRow}>
                  <Text style={styles.quoteSymbol}>{quote.symbol}</Text>
                  <View style={styles.quoteValues}>
                    <Text style={styles.quotePrice}>{formatPrice(quote.currentPrice, quote.symbol)}</Text>
                    <Text style={[styles.quoteChange, { color: isUp ? colors.positive : colors.negative }]}>
                      {isUp ? '+' : ''}
                      {quote.percentChange.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {!!article.url && (
          <Pressable style={styles.sourceButton} onPress={handleOpenSource}>
            <Text style={styles.sourceButtonText}>{t('newsDetail.openSource')}</Text>
          </Pressable>
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
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 12,
      marginBottom: 8,
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 12,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    summaryLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 10,
      marginBottom: 4,
    },
    summaryText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 24,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 10,
    },
    empty: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    loader: {
      marginVertical: 4,
    },
    quoteRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    quoteSymbol: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    quoteValues: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    quotePrice: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    quoteChange: {
      fontSize: 13,
      fontWeight: '700',
      minWidth: 60,
      textAlign: 'right',
    },
    sourceButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
    },
    sourceButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
  });
