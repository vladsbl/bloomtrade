import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PriceChart from '../components/PriceChart';
import { MarketStackParamList } from '../navigation/MarketStack';
import { resolveAsset } from '../services/assetRegistry';
import { getStockQuote } from '../services/financeApi';
import { getHistoricalPrices } from '../services/historicalPriceService';
import { useCurrency } from '../store/currency';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { HISTORY_RANGES, HistoricalSeries, HistoryRange } from '../types/history';
import { StockQuote } from '../types/quote';

type AssetDetailRouteProp = RouteProp<MarketStackParamList, 'AssetDetail'>;

export default function AssetDetailScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const styles = createStyles(colors);

  const { params } = useRoute<AssetDetailRouteProp>();
  const asset = resolveAsset(params.symbol);

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [range, setRange] = useState<HistoryRange>('1M');
  const [series, setSeries] = useState<HistoricalSeries | null>(null);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    getStockQuote(params.symbol)
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [params.symbol]);

  const loadSeries = useCallback(async () => {
    setChartLoading(true);
    const result = await getHistoricalPrices(params.symbol, range).catch(() => null);
    setSeries(result);
    setChartLoading(false);
  }, [params.symbol, range]);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  const hasQuote = quote !== null;
  const isUp = (quote?.percentChange ?? 0) >= 0;
  const changeColor = isUp ? colors.positive : colors.negative;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.symbol}>{asset.symbol}</Text>
          <Text style={styles.name}>{asset.name}</Text>
        </View>

        <View style={styles.priceBlock}>
          {hasQuote ? (
            <>
              <Text style={styles.price}>{formatPrice(quote!.currentPrice, params.symbol)}</Text>
              <Text style={[styles.change, { color: changeColor }]}>
                {isUp ? '+' : ''}
                {formatPrice(quote!.change, params.symbol, { withSymbol: false, compact: false })} (
                {isUp ? '+' : ''}
                {quote!.percentChange.toFixed(2)}%)
              </Text>
            </>
          ) : (
            <Text style={styles.unavailable}>{t('market.dataUnavailable')}</Text>
          )}
        </View>

        <PriceChart
          points={series?.points ?? []}
          loading={chartLoading}
          color={hasQuote ? changeColor : undefined}
          range={range}
          symbol={params.symbol}
        />

        <View style={styles.rangeRow}>
          {HISTORY_RANGES.map((r) => (
            <Pressable
              key={r}
              style={[styles.rangeButton, range === r && styles.rangeButtonActive]}
              onPress={() => setRange(r)}
            >
              <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        {series?.isFallback && <Text style={styles.fallbackNote}>{t('assetDetail.fallbackNote')}</Text>}
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
    },
    header: {
      marginBottom: 12,
    },
    symbol: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '800',
    },
    name: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 2,
    },
    priceBlock: {
      marginBottom: 16,
    },
    price: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '800',
    },
    change: {
      fontSize: 15,
      fontWeight: '700',
      marginTop: 4,
    },
    unavailable: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '600',
    },
    rangeRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 16,
    },
    rangeButton: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    rangeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    rangeText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    rangeTextActive: {
      color: '#fff',
    },
    fallbackNote: {
      color: colors.textSecondary,
      fontSize: 12,
      fontStyle: 'italic',
      marginTop: 16,
      textAlign: 'center',
    },
  });
