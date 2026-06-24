import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../store/theme';
import { ColorPalette } from '../../theme/palettes';

export interface ChartDatum {
  label: string;
  value: number;
  color?: string; // overrides the +/- color (e.g. histogram bins)
}

interface PerformanceChartProps {
  data: ChartDatum[];
  variant?: 'bars' | 'line';
  height?: number;
  positiveColor?: string;
  negativeColor?: string;
}

const DEFAULT_HEIGHT = 160;
const LABEL_BAND = 18;

/**
 * Minimal dependency-free SVG chart with two modes:
 *  - "bars": +/- columns around a zero baseline (weekday / month / hour P&L)
 *  - "line": a cumulative area+line (equity curve)
 */
export default function PerformanceChart({
  data,
  variant = 'bars',
  height = DEFAULT_HEIGHT,
  positiveColor,
  negativeColor,
}: PerformanceChartProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const up = positiveColor ?? colors.positive;
  const down = negativeColor ?? colors.negative;

  const renderable = data.length > 0 && width > 0;

  return (
    <View style={styles.container} onLayout={onLayout}>
      {renderable
        ? variant === 'bars'
          ? renderBars(data, width, height, up, down, colors)
          : renderLine(data, width, height, up, down)
        : null}
    </View>
  );
}

function renderBars(
  data: ChartDatum[],
  width: number,
  height: number,
  up: string,
  down: string,
  colors: ColorPalette
) {
  const plotHeight = height - LABEL_BAND;
  const baselineY = plotHeight / 2;
  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  const colWidth = width / data.length;
  const barWidth = Math.max(2, colWidth * 0.6);

  return (
    <Svg width={width} height={height}>
      <Line x1={0} y1={baselineY} x2={width} y2={baselineY} stroke={colors.border} strokeWidth={1} />
      {data.map((d, i) => {
        const h = (Math.abs(d.value) / maxAbs) * (baselineY - 2);
        const x = i * colWidth + (colWidth - barWidth) / 2;
        const y = d.value >= 0 ? baselineY - h : baselineY;
        return (
          <React.Fragment key={`${d.label}-${i}`}>
            <Rect x={x} y={y} width={barWidth} height={Math.max(h, 0.5)} rx={2} fill={d.color ?? (d.value >= 0 ? up : down)} />
            <SvgText
              x={i * colWidth + colWidth / 2}
              y={height - 5}
              fill={colors.textSecondary}
              fontSize={9}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function renderLine(data: ChartDatum[], width: number, height: number, up: string, down: string) {
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 8;
  const plotHeight = height - pad * 2;

  const x = (i: number) => (data.length === 1 ? width / 2 : (i / (data.length - 1)) * width);
  const y = (value: number) => pad + (1 - (value - min) / span) * plotHeight;

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(d.value).toFixed(2)}`).join(' ');
  const area = `${line} L ${width.toFixed(2)} ${height} L 0 ${height} Z`;
  const color = values[values.length - 1] >= values[0] ? up : down;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.25} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#perfFill)" />
      <Path d={line} stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
