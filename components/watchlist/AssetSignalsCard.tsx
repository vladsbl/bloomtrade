import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import OpportunityScore from './OpportunityScore';
import SignalBadge from './SignalBadge';
import { useCurrency } from '../../store/currency';
import { useLanguage } from '../../store/i18n';
import { useTheme } from '../../store/theme';
import { AssetSignals } from '../../types/marketSignals';
import { WatchlistItem } from '../../types/market';
import { ColorPalette } from '../../theme/palettes';

interface AssetSignalsCardProps {
  item: WatchlistItem;
  signals?: AssetSignals;
  onRemove: (symbol: string) => void;
  onPress?: (symbol: string) => void;
}

/** Watchlist row enriched with the opportunity score and detected signals. */
export default function AssetSignalsCard({ item, signals, onRemove, onPress }: AssetSignalsCardProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const styles = createStyles(colors);

  const hasQuote = item.price !== null && item.changePercent !== null;
  const isUp = (item.changePercent ?? 0) >= 0;
  const detected = signals?.signals ?? [];
  const showScore = !!signals?.hasData && signals.score.score > 0;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Pressable
          style={styles.main}
          onPress={onPress ? () => onPress(item.symbol) : undefined}
          disabled={!onPress}
        >
          <View style={styles.identity}>
            <Text style={styles.symbol}>{item.symbol}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          <View style={styles.values}>
            {hasQuote ? (
              <>
                <Text style={styles.price}>{formatPrice(item.price!, item.symbol)}</Text>
                <Text style={[styles.change, { color: isUp ? colors.positive : colors.negative }]}>
                  {isUp ? '+' : ''}
                  {item.changePercent!.toFixed(2)}%
                </Text>
              </>
            ) : (
              <Text style={styles.unavailable}>{t('market.dataUnavailable')}</Text>
            )}
          </View>

          {showScore && <OpportunityScore score={signals!.score.score} compact />}
        </Pressable>

        <Pressable onPress={() => onRemove(item.symbol)} hitSlop={8} style={styles.removeButton}>
          <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {detected.length > 0 && (
        <View style={styles.badges}>
          {detected.map((signal) => (
            <SignalBadge key={signal.kind} kind={signal.kind} />
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 8,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    main: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    identity: {
      flex: 1,
    },
    symbol: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    name: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    values: {
      alignItems: 'flex-end',
    },
    price: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    change: {
      fontSize: 12,
      fontWeight: '700',
      marginTop: 2,
    },
    unavailable: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    removeButton: {
      paddingLeft: 10,
    },
    badges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 10,
    },
  });
