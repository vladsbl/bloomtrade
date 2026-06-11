import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MarketOverviewCard from '../components/MarketOverviewCard';
import NewsCard from '../components/NewsCard';
import TopMoversCard from '../components/TopMoversCard';
import WatchlistCard from '../components/WatchlistCard';
import { MarketStackParamList } from '../navigation/MarketStack';
import { getMarketNews } from '../services/financeApi';
import { getMarketOverview } from '../services/marketOverviewService';
import { getTopMovers } from '../services/topMoversService';
import {
  getWatchlistQuotes,
  loadWatchlistSymbols,
  saveWatchlistSymbols,
} from '../services/watchlistService';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { MarketOverviewItem, TopMoversData, WatchlistItem } from '../types/market';
import { NewsItem } from '../types/news';

type MarketScreenNavigationProp = NativeStackNavigationProp<MarketStackParamList, 'MarketFeed'>;

export default function MarketScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const styles = createStyles(colors);

  const navigation = useNavigation<MarketScreenNavigationProp>();

  const [marketOverview, setMarketOverview] = useState<MarketOverviewItem[]>([]);
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [topMovers, setTopMovers] = useState<TopMoversData>({ gainers: [], losers: [] });
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [newAssetSymbol, setNewAssetSymbol] = useState('');

  const listRef = useRef<FlatList<NewsItem>>(null);
  useScrollToTop(listRef);

  const todayLabel = useMemo(() => {
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    const label = new Date().toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [language]);

  const loadDashboard = useCallback(async () => {
    const [overview, symbols, movers, newsItems] = await Promise.all([
      getMarketOverview().catch((): MarketOverviewItem[] => []),
      loadWatchlistSymbols(),
      getTopMovers().catch((): TopMoversData => ({ gainers: [], losers: [] })),
      getMarketNews().catch((): NewsItem[] => []),
    ]);

    const quotes = await getWatchlistQuotes(symbols).catch((): WatchlistItem[] => []);

    setMarketOverview(overview);
    setWatchlistSymbols(symbols);
    setWatchlistItems(quotes);
    setTopMovers(movers);
    setNews(newsItems);
  }, []);

  useEffect(() => {
    loadDashboard().finally(() => setLoading(false));
  }, [loadDashboard]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  const handleAddAsset = useCallback(async () => {
    const symbol = newAssetSymbol.trim().toUpperCase();
    setNewAssetSymbol('');
    setIsAddingAsset(false);

    if (!symbol || watchlistSymbols.includes(symbol)) return;

    const updatedSymbols = [...watchlistSymbols, symbol];
    setWatchlistSymbols(updatedSymbols);
    await saveWatchlistSymbols(updatedSymbols);

    const quotes = await getWatchlistQuotes(updatedSymbols);
    setWatchlistItems(quotes);
  }, [newAssetSymbol, watchlistSymbols]);

  const handleRemoveAsset = useCallback(
    (symbol: string) => {
      const updatedSymbols = watchlistSymbols.filter((s) => s !== symbol);
      setWatchlistSymbols(updatedSymbols);
      setWatchlistItems((prev) => prev.filter((item) => item.symbol !== symbol));
      saveWatchlistSymbols(updatedSymbols);
    },
    [watchlistSymbols]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        ref={listRef}
        data={news}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewsCard item={item} onPress={() => navigation.navigate('NewsDetail', { article: item })} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('market.empty')}</Text>
          </View>
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>{t('market.title')}</Text>
              <Text style={styles.date}>{todayLabel}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('market.overview')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.overviewList}
              >
                {marketOverview.map((item) => (
                  <MarketOverviewCard key={item.symbol} item={item} />
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t('market.watchlist')}</Text>
                <Pressable
                  onPress={() => setIsAddingAsset((prev) => !prev)}
                  hitSlop={8}
                  style={styles.addButton}
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                  <Text style={styles.addButtonText}>{t('market.addAsset')}</Text>
                </Pressable>
              </View>

              {isAddingAsset && (
                <View style={styles.addRow}>
                  <TextInput
                    style={styles.addInput}
                    placeholder={t('market.addSymbolPlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="characters"
                    autoFocus
                    returnKeyType="done"
                    value={newAssetSymbol}
                    onChangeText={setNewAssetSymbol}
                    onSubmitEditing={handleAddAsset}
                  />
                  <Pressable onPress={handleAddAsset} hitSlop={8}>
                    <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
                  </Pressable>
                </View>
              )}

              {watchlistItems.length === 0 ? (
                <Text style={styles.emptyText}>{t('market.watchlistEmpty')}</Text>
              ) : (
                watchlistItems.map((item) => (
                  <WatchlistCard key={item.symbol} item={item} onRemove={handleRemoveAsset} />
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('market.topMovers')}</Text>
              <View style={styles.moversRow}>
                <TopMoversCard
                  title={t('market.gainers')}
                  items={topMovers.gainers}
                  emptyLabel={t('market.noMovers')}
                />
                <TopMoversCard
                  title={t('market.losers')}
                  items={topMovers.losers}
                  emptyLabel={t('market.noMovers')}
                />
              </View>
            </View>

            <Text style={[styles.sectionTitle, styles.newsTitle]}>{t('market.news')}</Text>
          </View>
        }
      />
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
    header: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
    },
    date: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 4,
    },
    section: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 12,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    overviewList: {
      paddingRight: 6,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    addButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    addInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      color: colors.text,
      fontSize: 14,
    },
    moversRow: {
      flexDirection: 'row',
      gap: 10,
    },
    newsTitle: {
      paddingHorizontal: 16,
    },
    list: {
      paddingBottom: 24,
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      paddingHorizontal: 32,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
    },
  });
