import React, { useState } from 'react';
import { ActivityIndicator, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { HistoricalPoint } from '../types/history';

interface PriceChartProps {
  points: HistoricalPoint[];
  loading?: boolean;
  height?: number;
  color?: string;
}

const DEFAULT_HEIGHT = 220;
const V_PADDING = 12;

export default function PriceChart({ points, loading, height = DEFAULT_HEIGHT, color }: PriceChartProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  // Up/down tint is derived from the series unless an explicit color is given.
  const trendUp = points.length >= 2 && points[points.length - 1].price >= points[0].price;
  const lineColor = color ?? (trendUp ? colors.positive : colors.negative);

  const renderBody = () => {
    if (loading) {
      return (
        <View style={[styles.placeholder, { height }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    if (points.length < 2 || width === 0) {
      return (
        <View style={[styles.placeholder, { height }]}>
          {width !== 0 && <Text style={styles.empty}>{t('market.dataUnavailable')}</Text>}
        </View>
      );
    }

    const prices = points.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = max - min || 1;

    const x = (i: number) => (i / (points.length - 1)) * width;
    const y = (price: number) =>
      V_PADDING + (1 - (price - min) / span) * (height - V_PADDING * 2);

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(p.price).toFixed(2)}`)
      .join(' ');

    const areaPath = `${linePath} L ${width.toFixed(2)} ${height} L 0 ${height} Z`;

    return (
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity={0.25} />
            <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#priceFill)" />
        <Path d={linePath} stroke={lineColor} strokeWidth={2} fill="none" />
      </Svg>
    );
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      {renderBody()}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    placeholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    empty: {
      color: colors.textSecondary,
      fontSize: 13,
    },
  });
