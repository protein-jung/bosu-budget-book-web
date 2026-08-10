import { Text, View } from 'react-native';

export type GroupedBarSeries = {
  key: string;
  label: string;
  color: string;
};

export type GroupedBarGroup = {
  key: string;
  label: string;
  values: Record<string, number>;
};

const BAR_WIDTH = 14;
const GROUP_GAP = 10;

export function GroupedBarChart({
  groups,
  series,
  height = 140,
  formatValue,
}: {
  groups: GroupedBarGroup[];
  series: GroupedBarSeries[];
  height?: number;
  formatValue: (value: number) => string;
}) {
  const max = Math.max(
    1,
    ...groups.flatMap((g) => series.map((s) => g.values[s.key] ?? 0)),
  );

  return (
    <View className="gap-3">
      <View className="flex-row items-end justify-between" style={{ height }}>
        {groups.map((group) => (
          <View key={group.key} className="flex-1 items-center justify-end" style={{ marginHorizontal: GROUP_GAP / 2 }}>
            <View className="flex-row items-end gap-1">
              {series.map((s) => {
                const value = group.values[s.key] ?? 0;
                const barHeight = value > 0 ? Math.max((value / max) * (height - 24), 4) : 0;
                return (
                  <View
                    key={s.key}
                    style={{
                      width: BAR_WIDTH,
                      height: barHeight,
                      backgroundColor: s.color,
                      borderTopLeftRadius: 3,
                      borderTopRightRadius: 3,
                    }}
                  />
                );
              })}
            </View>
            <Text className="mt-1.5 text-[10px] text-slate-500" numberOfLines={1}>
              {group.label}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap gap-3">
        {series.map((s) => (
          <View key={s.key} className="flex-row items-center gap-1.5">
            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <Text className="text-xs text-slate-600 dark:text-slate-300">{s.label}</Text>
          </View>
        ))}
      </View>

      {groups.length > 0 ? (
        <Text className="text-xs text-slate-400">
          최대 {formatValue(max)}
        </Text>
      ) : null}
    </View>
  );
}
