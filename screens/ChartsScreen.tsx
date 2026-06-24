import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PriceChart, { PriceMarker } from '../components/PriceChart';
import { RootTabParamList } from '../navigation/types';
import { getAllAssets, resolveAsset } from '../services/assetRegistry';
import { getStockQuote } from '../services/financeApi';
import { getHistoricalPrices } from '../services/historicalPriceService';
import { collectOpenTrades } from '../services/portfolioAccountingService';
import { useCurrency } from '../store/currency';
import { useLanguage } from '../store/i18n';
import { useJournalByDate } from '../store/journalByDate';
import { useTheme } from '../store/theme';
import { HISTORY_RANGES, HistoricalSeries, HistoryRange } from '../types/history';
import { StockQuote } from '../types/quote';
import { ColorPalette } from '../theme/palettes';

type ChartsRouteProp = RouteProp<RootTabParamList, 'Charts'>;

export default function ChartsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { days } = useJournalByDate();
  const { params } = useRoute<ChartsRouteProp>();
  const styles = createStyles(colors);

  const openTrades = useMemo(() => collectOpenTrades(days), [days]);

  // Selectable symbols: open-position symbols first, then the registry.
  const symbolOptions = useMemo(() => {
    const open = openTrades.map((o) => o.trade.symbol);
    const registry = getAllAssets().map((a) => a.symbol);
    return Array.from(new Set([...open, ...registry]));
  }, [openTrades]);

  const [symbol, setSymbol] = useState(
    () => params?.symbol ?? openTrades[0]?.trade.symbol ?? symbolOptions[0] ?? 'BTC'
  );
  const [range, setRange] = useState<HistoryRange>('1M');
  const [series, setSeries] = useState<HistoricalSeries | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [quote, setQuote] = useState<StockQuote | null>(null);

  // Follow the symbol handed over from the Trades tab.
  useEffect(() => {
    if (params?.symbol) setSymbol(params.symbol);
  }, [params?.symbol]);

  const loadSeries = useCallback(async () => {
    setChartLoading(true);
    const result = await getHistoricalPrices(symbol, range).catch(() => null);
    setSeries(result);
    setChartLoading(false);
  }, [symbol, range]);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  useEffect(() => {
    let active = true;
    getStockQuote(symbol)
      .then((q) => active && setQuote(q))
      .catch(() => active && setQuote(null));
    return () => {
      active = false;
    };
  }, [symbol]);

  // Entry markers for open positions on the selected symbol (native prices).
  const markers = useMemo<PriceMarker[]>(
    () =>
      openTrades
        .filter((o) => o.trade.symbol === symbol)
        .map((o) => ({ id: o.trade.id, price: o.trade.entryPrice, direction: o.trade.direction })),
    [openTrades, symbol]
  );

  const asset = resolveAsset(symbol);
  const hasQuote = quote !== null;
  const isUp = (quote?.percentChange ?? 0) >= 0;
  const changeColor = isUp ? colors.positive : colors.negative;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('charts.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.symbolRow}
        >
          {symbolOptions.map((option) => (
            <Pressable
              key={option}
              style={[styles.symbolChip, option === symbol && styles.symbolChipActive]}
              onPress={() => setSymbol(option)}
            >
              <Text style={[styles.symbolChipText, option === symbol && styles.symbolChipTextActive]}>
                {option}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.priceBlock}>
          <Text style={styles.symbol}>{asset.symbol}</Text>
          <Text style={styles.name}>{asset.name}</Text>
          {hasQuote ? (
            <>
              <Text style={styles.price}>{formatPrice(quote!.currentPrice, symbol)}</Text>
              <Text style={[styles.change, { color: changeColor }]}>
                {isUp ? '+' : ''}
                {formatPrice(quote!.change, symbol, { withSymbol: false, compact: false })} (
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
          symbol={symbol}
          markers={markers}
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

        {markers.length > 0 && (
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>{t('charts.openEntries')}</Text>
            {markers.map((marker) => {
              const isLong = marker.direction === 'LONG';
              const color = isLong ? colors.positive : colors.negative;
              return (
                <View key={marker.id} style={styles.legendRow}>
                  <View style={[styles.legendBadge, { backgroundColor: color }]}>
                    <Text style={styles.legendBadgeText}>
                      {isLong ? t('trade.long') : t('trade.short')}
                    </Text>
                  </View>
                  <Text style={styles.legendPrice}>{formatPrice(marker.price, symbol)}</Text>
                </View>
              );
            })}
          </View>
        )}

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
      padding: 16,
      paddingTop: 4,
    },
    symbolRow: {
      gap: 8,
      paddingBottom: 14,
    },
    symbolChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    symbolChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    symbolChipText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    symbolChipTextActive: {
      color: '#fff',
    },
    priceBlock: {
      marginBottom: 16,
    },
    symbol: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
    },
    name: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    price: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '800',
      marginTop: 8,
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
      marginTop: 8,
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
    legend: {
      marginTop: 20,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    legendTitle: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 5,
    },
    legendBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 4,
    },
    legendBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    legendPrice: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    fallbackNote: {
      color: colors.textSecondary,
      fontSize: 12,
      fontStyle: 'italic',
      marginTop: 16,
      textAlign: 'center',
    },
  });
