import { Link, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { Screen } from '@/components/Screen';
import { useAssets } from '@/features/asset/api';
import { formatKrw } from '@/lib/format';
import { ASSET_TYPE_META, CATEGORY_COLOR_PALETTE } from '@/lib/palette';
import { useIsDesktop } from '@/lib/responsive';
import type { AssetType } from '@/lib/types';

function isAssetType(value: string | undefined): value is AssetType {
  return !!value && Object.prototype.hasOwnProperty.call(ASSET_TYPE_META, value);
}

export default function AssetTypeDetailScreen() {
  const { type: typeParam } = useLocalSearchParams<{ type: string }>();
  const isDesktop = useIsDesktop();
  const { data: assets = [], isLoading } = useAssets();

  const type = isAssetType(typeParam) ? typeParam : null;
  const meta = type ? ASSET_TYPE_META[type] : null;

  // 유형 안의 개별 자산(종목/계좌/부동산 등) 하나하나가 곧 구성 항목이다 — 이미 자산마다
  // 별도 행으로 등록돼있으므로 그대로 도넛/막대 차트의 조각이 된다. 대출은 자산 구성에서
  // 빚이라 아예 제외되므로(overview 화면) 이 페이지로 들어올 일이 없다.
  const items = useMemo(() => {
    if (!type) return [];
    return assets
      .filter((a) => a.type === type && (a.currentValue ?? 0) > 0)
      .map((a, index) => ({
        id: a.id,
        name: a.name,
        custodian: a.custodian,
        value: a.currentValue ?? 0,
        color: CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [assets, type]);

  const total = items.reduce((sum, item) => sum + item.value, 0);
  const donutData = useMemo(() => items.map((i) => ({ key: String(i.id), value: i.value, color: i.color })), [items]);
  const barData = useMemo(
    () => items.map((i) => ({ key: String(i.id), label: i.name, value: i.value, color: i.color })),
    [items],
  );

  if (!type || !meta) {
    return (
      <Screen>
        <Text className="text-slate-500 dark:text-slate-400">알 수 없는 자산 유형이에요.</Text>
        <Link href="/portfolio" className="self-start text-sm font-medium text-primary dark:text-secondary">
          ‹ 자산 개요로
        </Link>
      </Screen>
    );
  }

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[720px]' : 'max-w-[480px]'}>
      <Link href="/portfolio" className="self-start text-sm font-medium text-primary dark:text-secondary">
        ‹ 자산 개요로
      </Link>

      <View className="gap-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          {meta.icon} {meta.label}
        </Text>
        <Text className="text-lg font-semibold text-primary">{formatKrw(total)}</Text>
        <Text className="text-xs text-slate-400">{items.length}개 자산</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : items.length === 0 ? (
        <Text className="py-6 text-center text-slate-400">표시할 자산이 없어요.</Text>
      ) : (
        <>
          <View className="items-center gap-4 rounded-2xl bg-white p-5 dark:bg-slate-900">
            <DonutChart data={donutData} size={200} thickness={28}>
              <Text className="text-xs text-slate-400">{meta.label} 합계</Text>
              <Text className="text-base font-bold text-slate-900 dark:text-white">{formatKrw(total)}</Text>
            </DonutChart>
            <View className="w-full gap-2">
              {items.map((item) => (
                <View key={item.id} className="flex-row items-center gap-2">
                  <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <Text className="flex-1 text-sm text-slate-700 dark:text-slate-200" numberOfLines={1}>
                    {item.name}
                    {item.custodian ? ` · ${item.custodian}` : ''}
                  </Text>
                  <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                    {((item.value / total) * 100).toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="gap-4 rounded-2xl bg-white p-5 dark:bg-slate-900">
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">항목별 비중</Text>
            <BarChart
              data={barData}
              formatValue={(value) => `${((value / total) * 100).toFixed(1)}% · ${formatKrw(value)}`}
            />
          </View>
        </>
      )}
    </Screen>
  );
}
