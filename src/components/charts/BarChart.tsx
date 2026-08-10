import { Text, View } from 'react-native';

export type BarDatum = {
  key: string;
  label: string;
  value: number;
  color: string;
};

const CORNER_RADIUS = 4;

export function BarChart({
  data,
  maxValue,
  formatValue,
  thickness = 12,
}: {
  data: BarDatum[];
  maxValue?: number;
  formatValue: (value: number) => string;
  thickness?: number;
}) {
  const max = maxValue ?? Math.max(1, ...data.map((d) => d.value));

  return (
    <View className="gap-3">
      {data.map((d) => {
        const pct = d.value > 0 ? Math.max((d.value / max) * 100, 3) : 0;
        return (
          <View key={d.key} className="gap-1.5">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-sm text-slate-700 dark:text-slate-200" numberOfLines={1}>
                {d.label}
              </Text>
              <Text className="text-sm font-semibold text-slate-900 dark:text-white">{formatValue(d.value)}</Text>
            </View>
            <View
              className="overflow-hidden bg-slate-100 dark:bg-slate-800"
              style={{ height: thickness, borderRadius: CORNER_RADIUS }}>
              <View
                style={{
                  width: `${pct}%`,
                  height: thickness,
                  backgroundColor: d.color,
                  borderTopRightRadius: CORNER_RADIUS,
                  borderBottomRightRadius: CORNER_RADIUS,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
