import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { HistoricalPoint, HistoryRange } from '../types/history';

interface PriceChartProps {
  points: HistoricalPoint[];
  loading?: boolean;
  height?: number;
  color?: string;
  // Used to decide whether the scrubber tooltip shows a time alongside the date.
  range?: HistoryRange;
}

const DEFAULT_HEIGHT = 220;
const V_PADDING = 12;
const TOOLTIP_WIDTH = 132;

export default function PriceChart({ points, loading, height = DEFAULT_HEIGHT, color, range }: PriceChartProps) {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const styles = createStyles(colors);

  const [width, setWidth] = useState(0);
  // Index of the point currently under the user's finger, or null when idle.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  // Up/down tint is derived from the series unless an explicit color is given.
  const trendUp = points.length >= 2 && points[points.length - 1].price >= points[0].price;
  const lineColor = color ?? (trendUp ? colors.positive : colors.negative);

  const renderable = points.length >= 2 && width > 0;

  // Geometry shared by the area fill, the line, and the interactive crosshair.
  const geometry = useMemo(() => {
    if (!renderable) return null;

    const prices = points.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = max - min || 1;

    const x = (i: number) => (i / (points.length - 1)) * width;
    const y = (price: number) => V_PADDING + (1 - (price - min) / span) * (height - V_PADDING * 2);

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(p.price).toFixed(2)}`)
      .join(' ');
    const areaPath = `${linePath} L ${width.toFixed(2)} ${height} L 0 ${height} Z`;

    return { x, y, linePath, areaPath };
  }, [renderable, points, width, height]);

  // Map a touch x-position to the nearest data point and select it.
  const updateActive = (event: GestureResponderEvent) => {
    if (!renderable) return;
    const clampedX = Math.max(0, Math.min(width, event.nativeEvent.locationX));
    const idx = Math.round((clampedX / width) * (points.length - 1));
    setActiveIndex(Math.max(0, Math.min(points.length - 1, idx)));
  };

  const clearActive = () => setActiveIndex(null);

  const renderBody = () => {
    if (loading) {
      return (
        <View style={[styles.placeholder, { height }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    if (!geometry) {
      return (
        <View style={[styles.placeholder, { height }]}>
          {width !== 0 && <Text style={styles.empty}>{t('market.dataUnavailable')}</Text>}
        </View>
      );
    }

    const active = activeIndex !== null ? points[activeIndex] : null;
    const activeX = activeIndex !== null ? geometry.x(activeIndex) : 0;
    const activeY = active ? geometry.y(active.price) : 0;
    const tooltipLeft = Math.max(0, Math.min(width - TOOLTIP_WIDTH, activeX - TOOLTIP_WIDTH / 2));

    return (
      <View>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={lineColor} stopOpacity={0.25} />
              <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={geometry.areaPath} fill="url(#priceFill)" />
          <Path d={geometry.linePath} stroke={lineColor} strokeWidth={2} fill="none" />
          {active && (
            <>
              <Line
                x1={activeX}
                y1={0}
                x2={activeX}
                y2={height}
                stroke={colors.textSecondary}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <Circle cx={activeX} cy={activeY} r={5} fill={lineColor} stroke={colors.background} strokeWidth={2} />
            </>
          )}
        </Svg>
        {active && (
          <View pointerEvents="none" style={[styles.tooltip, { left: tooltipLeft }]}>
            <Text style={styles.tooltipPrice}>${formatTooltipPrice(active.price)}</Text>
            <Text style={styles.tooltipTime}>{formatPointLabel(active.time, range, language)}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View
      style={styles.container}
      onLayout={onLayout}
      onStartShouldSetResponder={() => renderable}
      onMoveShouldSetResponder={() => renderable}
      onResponderGrant={updateActive}
      onResponderMove={updateActive}
      onResponderRelease={clearActive}
      onResponderTerminate={clearActive}
    >
      {renderBody()}
    </View>
  );
}

function formatTooltipPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

// Short month labels per language — manual formatting avoids relying on Intl
// date options, which Hermes does not implement consistently across platforms.
const MONTHS: Record<'en' | 'fr', string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
};

function formatPointLabel(iso: string, range: HistoryRange | undefined, language: 'en' | 'fr'): string {
  const d = new Date(iso);
  const dateStr = `${d.getDate()} ${(MONTHS[language] ?? MONTHS.en)[d.getMonth()]}`;

  // Short ranges carry intraday granularity, so a clock time is meaningful;
  // 3M/1Y are daily candles where the date alone is enough.
  const withTime = range === '1D' || range === '1W' || range === '1M';
  if (!withTime) return dateStr;

  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${dateStr} · ${hh}:${mm}`;
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
    tooltip: {
      position: 'absolute',
      top: 0,
      width: TOOLTIP_WIDTH,
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      alignItems: 'center',
    },
    tooltipPrice: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    tooltipTime: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '600',
      marginTop: 2,
    },
  });
