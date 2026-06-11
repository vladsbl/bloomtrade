import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NewsCard from '../components/NewsCard';
import { MarketStackParamList } from '../navigation/MarketStack';
import { getMarketNews } from '../services/financeApi';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { NewsItem } from '../types/news';

type MarketScreenNavigationProp = NativeStackNavigationProp<MarketStackParamList, 'MarketFeed'>;

export default function MarketScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const navigation = useNavigation<MarketScreenNavigationProp>();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<FlatList<NewsItem>>(null);
  useScrollToTop(listRef);

  useEffect(() => {
    getMarketNews()
      .then(setNews)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('market.title')}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.empty}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={news}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NewsCard item={item} onPress={() => navigation.navigate('NewsDetail', { article: item })} />
          )}
          contentContainerStyle={styles.list}
        />
      )}
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
    list: {
      paddingTop: 4,
      paddingBottom: 24,
    },
    loader: {
      marginTop: 24,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    errorText: {
      color: colors.negative,
      fontSize: 14,
      textAlign: 'center',
    },
  });
