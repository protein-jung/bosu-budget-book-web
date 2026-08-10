import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export type DonutDatum = {
  key: string;
  value: number;
  color: string;
};

const TRACK_COLOR = '#ffffff';
const SEGMENT_GAP = 2;

export function DonutChart({
  data,
  size = 168,
  thickness = 24,
  children,
}: {
  data: DonutDatum[];
  size?: number;
  thickness?: number;
  children?: ReactNode;
}) {
  const total = data.reduce((sum, d) => sum + Math.max(d.value, 0), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G transform={`rotate(-90, ${size / 2}, ${size / 2})`}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={TRACK_COLOR} strokeWidth={thickness} fill="none" />
          {total > 0
            ? data.map((d) => {
                if (d.value <= 0) return null;
                const length = (d.value / total) * circumference;
                const dash = Math.max(length - SEGMENT_GAP, 0);
                const offset = -cumulative;
                cumulative += length;
                return (
                  <Circle
                    key={d.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={d.color}
                    strokeWidth={thickness}
                    strokeDasharray={`${dash} ${Math.max(circumference - dash, 0)}`}
                    strokeDashoffset={offset}
                    strokeLinecap="butt"
                    fill="none"
                  />
                );
              })
            : null}
        </G>
      </Svg>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
