import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AssetSearchInput from '../AssetSearchInput';
import { AnalysisTimeframe } from '../../services/aiMarketAnalyst/types';
import { resolveAsset } from '../../services/assetRegistry';
import { loadWatchlistSymbols } from '../../services/watchlistService';
import { useLanguage } from '../../store/i18n';
import { useTheme } from '../../store/theme';
import { TranslationKey } from '../../store/translations';
import { ColorPalette } from '../../theme/palettes';

interface AssetSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (symbol: string, timeframe: AnalysisTimeframe) => void;
  // Symbols already relevant to the user (e.g. open positions) shown first.
  favorites?: string[];
}

const TIMEFRAMES: { value: AnalysisTimeframe; labelKey: TranslationKey }[] = [
  { value: 'intraday', labelKey: 'ai.timeframe.intraday' },
  { value: 'swing', labelKey: 'ai.timeframe.swing' },
  { value: 'position', labelKey: 'ai.timeframe.position' },
];

export default function AssetSelectorModal({ visible, onClose, onConfirm, favorites }: AssetSelectorModalProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<AnalysisTimeframe>('swing');

  useEffect(() => {
    if (visible) loadWatchlistSymbols().then(setWatchlist).catch(() => setWatchlist([]));
  }, [visible]);

  // Quick-pick chips: favorites (open positions) first, then the watchlist.
  const quickSymbols = useMemo(() => {
    const merged = [...(favorites ?? []), ...watchlist];
    return Array.from(new Set(merged));
  }, [favorites, watchlist]);

  const reset = () => {
    setSelected(null);
    setTimeframe('swing');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected, timeframe);
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.handleRow}>
            <Text style={styles.title}>{t('ai.modal.title')}</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabel}>{t('ai.modal.selectAsset')}</Text>

            {quickSymbols.length > 0 && (
              <View style={styles.chipsRow}>
                {quickSymbols.map((symbol) => (
                  <Pressable
                    key={symbol}
                    style={[styles.chip, selected === symbol && styles.chipActive]}
                    onPress={() => setSelected(symbol)}
                  >
                    <Text style={[styles.chipText, selected === symbol && styles.chipTextActive]}>{symbol}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <AssetSearchInput existingSymbols={[]} autoFocus={false} onSelect={(asset) => setSelected(asset.symbol)} />

            {selected && (
              <View style={styles.selectedRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.positive} />
                <Text style={styles.selectedText}>
                  {selected} · {resolveAsset(selected).name}
                </Text>
              </View>
            )}

            <Text style={[styles.sectionLabel, styles.sectionSpaced]}>{t('ai.modal.selectTimeframe')}</Text>
            <View style={styles.timeframeRow}>
              {TIMEFRAMES.map((option) => (
                <Pressable
                  key={option.value}
                  style={[styles.timeframe, timeframe === option.value && styles.timeframeActive]}
                  onPress={() => setTimeframe(option.value)}
                >
                  <Text style={[styles.timeframeText, timeframe === option.value && styles.timeframeTextActive]}>
                    {t(option.labelKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Pressable
            style={[styles.runButton, !selected && styles.runButtonDisabled]}
            onPress={handleConfirm}
            disabled={!selected}
          >
            <Text style={styles.robot}>🤖</Text>
            <Text style={styles.runButtonText}>{t('ai.modal.run')}</Text>
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '85%',
    },
    handleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 8,
    },
    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    content: {
      paddingHorizontal: 18,
      paddingBottom: 12,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    sectionSpaced: {
      marginTop: 14,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    chipTextActive: {
      color: '#fff',
    },
    selectedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    selectedText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    timeframeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    timeframe: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    timeframeActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timeframeText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    timeframeTextActive: {
      color: '#fff',
    },
    runButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      margin: 18,
      marginTop: 8,
      paddingVertical: 15,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    runButtonDisabled: {
      opacity: 0.4,
    },
    robot: {
      fontSize: 16,
    },
    runButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '800',
    },
  });
