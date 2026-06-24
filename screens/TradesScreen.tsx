import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccountOverviewCard from '../components/account/AccountOverviewCard';
import OpenPositionCard from '../components/account/OpenPositionCard';
import { useOpenPositions } from '../hooks/useOpenPositions';
import { RootTabParamList } from '../navigation/types';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';

type TradesNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Trades'>;

/** MT5-style Trade tab: account snapshot + the list of open positions. */
export default function TradesScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<TradesNavigationProp>();
  const styles = createStyles(colors);

  const { positions, summary, loading, refreshing, refresh, closingId, closePosition } =
    useOpenPositions();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('trades.title')}</Text>
      </View>

      <FlatList
        data={positions}
        keyExtractor={(item) => item.trade.id}
        renderItem={({ item }) => (
          <OpenPositionCard
            position={item}
            closing={closingId === item.trade.id}
            onClose={() => closePosition(item)}
            onPressChart={() => navigation.navigate('Charts', { symbol: item.trade.symbol })}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View>
            <AccountOverviewCard summary={summary} />
            <Text style={styles.sectionHeading}>{t('positions.title')}</Text>
            {loading && <ActivityIndicator color={colors.primary} style={styles.loader} />}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <Text style={styles.empty}>{t('positions.empty')}</Text>
          )
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
    sectionHeading: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
      paddingHorizontal: 16,
      marginTop: 8,
      marginBottom: 12,
    },
    loader: {
      marginVertical: 16,
    },
    empty: {
      color: colors.textSecondary,
      fontSize: 14,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
  });
