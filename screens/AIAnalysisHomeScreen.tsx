import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AssetSelectorModal from '../components/aiAnalyst/AssetSelectorModal';
import { TradesStackParamList } from '../navigation/TradesStack';
import { getAnalysisHistory } from '../services/aiMarketAnalyst/cache';
import { AnalysisTimeframe, MarketAnalysisOutput, MarketBias } from '../services/aiMarketAnalyst/types';
import { collectOpenTrades } from '../services/portfolioAccountingService';
import { useLanguage } from '../store/i18n';
import { useJournalByDate } from '../store/journalByDate';
import { useTheme } from '../store/theme';
import { TranslationKey } from '../store/translations';
import { ColorPalette } from '../theme/palettes';

type NavigationProp = NativeStackNavigationProp<TradesStackParamList, 'AIAnalysisHome'>;

const TIMEFRAME_LABEL: Record<AnalysisTimeframe, TranslationKey> = {
  intraday: 'ai.timeframe.intraday',
  swing: 'ai.timeframe.swing',
  position: 'ai.timeframe.position',
};

/** Landing screen for the AI analyst: past analyses + a "+" to run a new one. */
export default function AIAnalysisHomeScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<NavigationProp>();
  const { days } = useJournalByDate();
  const styles = createStyles(colors);

  const [modalVisible, setModalVisible] = useState(false);
  const [history, setHistory] = useState<MarketAnalysisOutput[]>([]);

  // Refresh the list every time the screen regains focus (e.g. after a new run).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAnalysisHistory().then((entries) => active && setHistory(entries));
      return () => {
        active = false;
      };
    }, [])
  );

  const favorites = useMemo(
    () => Array.from(new Set(collectOpenTrades(days).map((o) => o.trade.symbol))),
    [days]
  );

  const startNew = (symbol: string, timeframe: AnalysisTimeframe) => {
    setModalVisible(false);
    navigation.navigate('AIAnalysis', { symbol, timeframe });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)} hitSlop={8}>
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.title}>{t('ai.home.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => `${item.asset}:${item.timeframe}:${item.timestamp}`}
        renderItem={({ item }) => (
          <HistoryCard
            item={item}
            colors={colors}
            timeframeLabel={t(TIMEFRAME_LABEL[item.timeframe])}
            biasLabel={biasLabel(item.executiveSummary.bias, t)}
            onPress={() =>
              navigation.navigate('AIAnalysis', {
                symbol: item.asset,
                timeframe: item.timeframe,
                fromHistory: true,
              })
            }
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyRobot}>🤖</Text>
            <Text style={styles.emptyTitle}>{t('ai.home.empty')}</Text>
            <Text style={styles.emptyHint}>{t('ai.home.emptyHint')}</Text>
            <Pressable style={styles.emptyButton} onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.emptyButtonText}>{t('ai.home.newAnalysis')}</Text>
            </Pressable>
          </View>
        }
      />

      <AssetSelectorModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={startNew}
        favorites={favorites}
      />
    </SafeAreaView>
  );
}

function HistoryCard({
  item,
  colors,
  timeframeLabel,
  biasLabel,
  onPress,
}: {
  item: MarketAnalysisOutput;
  colors: ColorPalette;
  timeframeLabel: string;
  biasLabel: string;
  onPress: () => void;
}) {
  const styles = createStyles(colors);
  const color = biasColor(item.executiveSummary.bias, colors);
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardLeft}>
        <View style={styles.cardTopLine}>
          <Text style={styles.cardSymbol}>{item.asset}</Text>
          <View style={styles.timeframeChip}>
            <Text style={styles.timeframeText}>{timeframeLabel}</Text>
          </View>
        </View>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.assetName}
        </Text>
        <View style={styles.cardMeta}>
          <View style={[styles.biasDot, { backgroundColor: color }]} />
          <Text style={[styles.cardBias, { color }]}>{biasLabel}</Text>
          <Text style={styles.cardDot}>·</Text>
          <Text style={styles.cardWhen}>{formatWhen(item.timestamp)}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.cardScore, { color }]}>{item.executiveSummary.conviction}</Text>
        <Text style={styles.cardScoreLabel}>/100</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

function biasColor(bias: MarketBias, colors: ColorPalette): string {
  return bias === 'bullish' ? colors.positive : bias === 'bearish' ? colors.negative : colors.textSecondary;
}

function biasLabel(bias: MarketBias, t: (key: TranslationKey) => string): string {
  return t(bias === 'bullish' ? 'ai.gen.biasBullish' : bias === 'bearish' ? 'ai.gen.biasBearish' : 'ai.gen.biasNeutral');
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} · ${hh}:${min}`;
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
    headerSpacer: {
      width: 40,
    },
    list: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 24,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 10,
    },
    cardLeft: {
      flex: 1,
    },
    cardTopLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardSymbol: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    timeframeChip: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeframeText: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '700',
    },
    cardName: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    biasDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    cardBias: {
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    cardDot: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    cardWhen: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    cardRight: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    cardScore: {
      fontSize: 20,
      fontWeight: '800',
    },
    cardScoreLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '600',
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
      paddingHorizontal: 32,
      gap: 8,
    },
    emptyRobot: {
      fontSize: 44,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
      marginTop: 6,
    },
    emptyHint: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 19,
    },
    emptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 14,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 10,
      backgroundColor: colors.primary,
    },
    emptyButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '800',
    },
  });
