import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

export type TrendPoint = { key: string; label: string; value: number };

export function TrendLineChart({
  data,
  width,
  height = 120,
  color = '#1F6F5C',
  formatValue,
}: {
  data: TrendPoint[];
  width: number;
  height?: number;
  color?: string;
  formatValue: (value: number) => string;
}) {
  const [gradientId] = useState(() => `trend-fill-${Math.random().toString(36).slice(2)}`);

  if (data.length === 0 || width <= 0) return null;

  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const padding = 6;
  const usableWidth = Math.max(width - padding * 2, 1);
  const usableHeight = Math.max(height - padding * 2, 1);
  const stepX = data.length > 1 ? usableWidth / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: padding + stepX * i,
    y: padding + usableHeight - ((d.value - min) / range) * usableHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath =
    `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padding} ` +
    `L ${points[0].x.toFixed(1)} ${height - padding} Z`;

  const first = data[0];
  const last = data[data.length - 1];
  const lastPoint = points[points.length - 1];
  const rising = last.value >= first.value;

  return (
    <View className="gap-1.5">
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.28} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill={`url(#${gradientId})`} />
        <Path d={linePath} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Circle cx={lastPoint.x} cy={lastPoint.y} r={3.5} fill={color} />
      </Svg>
      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] text-slate-400">{first.label}</Text>
        <Text className={`text-xs font-semibold ${rising ? 'text-emerald-600' : 'text-red-500'}`}>
          {formatValue(last.value)}
        </Text>
        <Text className="text-[10px] text-slate-400">{last.label}</Text>
      </View>
    </View>
  );
}
