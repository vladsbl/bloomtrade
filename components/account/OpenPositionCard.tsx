import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCurrency } from '../../store/currency';
import { useLanguage } from '../../store/i18n';
import { useTheme } from '../../store/theme';
import { useTradingAccount } from '../../store/tradingAccount';
import { OpenPosition } from '../../types/account';
import { ColorPalette } from '../../theme/palettes';

interface OpenPositionCardProps {
  position: OpenPosition;
  onClose: () => void;
  closing: boolean;
  onPressChart?: () => void; // open this symbol in the Charts tab
}

/** A single open position with live valuation and a Close action. */
export default function OpenPositionCard({ position, onClose, closing, onPressChart }: OpenPositionCardProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { formatMoney } = useTradingAccount();
  const styles = createStyles(colors);

  const { trade } = position;
  const isLong = trade.direction === 'LONG';
  const pnlColor =
    position.unrealizedPnl > 0
      ? colors.positive
      : position.unrealizedPnl < 0
        ? colors.negative
        : colors.textSecondary;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.identity}>
          <Text style={styles.symbol}>{trade.symbol}</Text>
          <View style={[styles.badge, { backgroundColor: isLong ? colors.positive : colors.negative }]}>
            <Text style={styles.badgeText}>{isLong ? t('trade.long') : t('trade.short')}</Text>
          </View>
          <Text style={styles.leverage}>x{position.leverage}</Text>
        </View>
        {position.hasPrice ? (
          <View style={styles.pnlBox}>
            <Text style={[styles.pnl, { color: pnlColor }]}>
              {formatMoney(position.unrealizedPnl, { signed: true })}
            </Text>
            <Text style={[styles.pnlPercent, { color: pnlColor }]}>
              {position.unrealizedPnlPercent >= 0 ? '+' : ''}
              {position.unrealizedPnlPercent.toFixed(2)}%
            </Text>
          </View>
        ) : (
          <Text style={styles.unquoted}>{t('positions.unquoted')}</Text>
        )}
      </View>

      <View style={styles.metricsRow}>
        <Metric label={t('positions.quantity')} value={formatQty(trade.quantity)} colors={colors} />
        <Metric label={t('positions.entryPrice')} value={formatPrice(trade.entryPrice, trade.symbol)} colors={colors} />
        <Metric
          label={t('positions.currentPrice')}
          value={position.currentPrice !== null ? formatPrice(position.currentPrice, trade.symbol) : '—'}
          colors={colors}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.openedOn}>
          {t('positions.openedOn')} {formatOpenDate(trade.openedAt, position.date)}
        </Text>
        <View style={styles.actions}>
          {!!onPressChart && (
            <Pressable style={styles.chartButton} onPress={onPressChart} hitSlop={6}>
              <Ionicons name="pulse-outline" size={18} color={colors.primary} />
            </Pressable>
          )}
          <Pressable
            style={[styles.closeButton, (!position.hasPrice || closing) && styles.closeButtonDisabled]}
            onPress={onClose}
            disabled={!position.hasPrice || closing}
          >
            {closing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.closeButtonText}>{t('positions.close')}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Metric({ label, value, colors }: { label: string; value: string; colors: ColorPalette }) {
  const styles = createStyles(colors);
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function formatQty(qty: number): string {
  const rounded = Math.round(qty * 1e6) / 1e6;
  return rounded.toString();
}

function formatOpenDate(openedAt: number | undefined, fallbackDate: string): string {
  const date = Number.isFinite(openedAt) ? new Date(openedAt as number) : new Date(`${fallbackDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return fallbackDate;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginHorizontal: 16,
      marginBottom: 10,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    identity: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    symbol: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    badge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 4,
    },
    badgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    leverage: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
    },
    pnlBox: {
      alignItems: 'flex-end',
    },
    pnl: {
      fontSize: 16,
      fontWeight: '800',
    },
    pnlPercent: {
      fontSize: 12,
      fontWeight: '700',
      marginTop: 2,
    },
    unquoted: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    metric: {
      flex: 1,
    },
    metricLabel: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 3,
    },
    metricValue: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    openedOn: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    chartButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButton: {
      backgroundColor: colors.negative,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      minWidth: 96,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonDisabled: {
      opacity: 0.4,
    },
    closeButtonText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 13,
    },
  });
