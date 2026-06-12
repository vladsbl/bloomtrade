import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { TradeStatus } from '../types/trade';

export default function TradeStatusBadge({ status }: { status: TradeStatus }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const STATUS_BADGE: Record<TradeStatus, { emoji: string; label: string; color: string }> = {
    open: { emoji: '🟢', label: t('trade.badgeOpen'), color: colors.positive },
    closed: { emoji: '⚫', label: t('trade.badgeClosed'), color: colors.textSecondary },
  };

  const badge = STATUS_BADGE[status];

  return (
    <View style={[styles.badge, { borderColor: badge.color }]}>
      <Text style={styles.text}>
        {badge.emoji} {badge.label}
      </Text>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    text: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '600',
    },
  });
