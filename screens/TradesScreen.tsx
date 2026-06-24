import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccountOverviewCard from '../components/account/AccountOverviewCard';
import OpenPositionCard from '../components/account/OpenPositionCard';
import AIAnalystButton from '../components/aiAnalyst/AIAnalystButton';
import AssetSelectorModal from '../components/aiAnalyst/AssetSelectorModal';
import { useOpenPositions } from '../hooks/useOpenPositions';
import { TradesStackParamList } from '../navigation/TradesStack';
import { RootTabParamList } from '../navigation/types';
import { AnalysisTimeframe } from '../services/aiMarketAnalyst/types';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';

// Composite: navigate within the Trades stack (AIAnalysis) and to sibling tabs (Charts).
type TradesNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<TradesStackParamList, 'TradesHome'>,
  BottomTabNavigationProp<RootTabParamList>
>;

/** MT5-style Trade tab: account snapshot + the list of open positions. */
export default function TradesScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<TradesNavigationProp>();
  const styles = createStyles(colors);

  const { positions, summary, loading, refreshing, refresh, closingId, closePosition } =
    useOpenPositions();

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const positionSymbols = useMemo(
    () => Array.from(new Set(positions.map((p) => p.trade.symbol))),
    [positions]
  );

  const handleRunAnalysis = (symbol: string, timeframe: AnalysisTimeframe) => {
    setAiModalVisible(false);
    navigation.navigate('AIAnalysis', { symbol, timeframe });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('trades.title')}</Text>
        <Pressable style={styles.portfolioButton} onPress={() => navigation.navigate('Portfolio')}>
          <Ionicons name="pie-chart-outline" size={16} color={colors.primary} />
          <Text style={styles.portfolioButtonText}>{t('portfolio.title')}</Text>
        </Pressable>
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
            <AIAnalystButton onPress={() => setAiModalVisible(true)} />
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

      <AssetSelectorModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
        onConfirm={handleRunAnalysis}
        favorites={positionSymbols}
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
    portfolioButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
    },
    portfolioButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
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
