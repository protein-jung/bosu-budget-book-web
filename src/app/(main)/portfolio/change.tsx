import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { Screen } from '@/components/Screen';
import { useAssetSummary, useAssetTrend } from '@/features/asset/api';
import { ChangeLabel } from '@/features/asset/ChangeLabel';
import { computeChange } from '@/features/asset/change';
import { formatKrw } from '@/lib/format';
import { ASSET_TYPE_META } from '@/lib/palette';
import { useIsDesktop } from '@/lib/responsive';
import type { AssetType } from '@/lib/types';

const ASSET_TYPE_ORDER = Object.keys(ASSET_TYPE_META) as AssetType[];

function TypeChangeRow({ type, start, current }: { type: AssetType; start: number; current: number }) {
  const meta = ASSET_TYPE_META[type];
  const delta = current - start;
  const change = computeChange(start, current);
  return (
    <View className="flex-row items-center justify-between rounded-xl bg-white p-4 dark:bg-slate-900">
      <View className="flex-1 gap-0.5">
        <Text className="font-medium text-slate-900 dark:text-white">
          {meta.icon} {meta.label}
        </Text>
        <Text className="text-xs text-slate-400">
          {formatKrw(start)} → {formatKrw(current)}
        </Text>
      </View>
      <View className="items-end gap-0.5">
        <Text className={`font-semibold ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {delta >= 0 ? '▲ +' : '▼ '}
          {formatKrw(Math.round(delta))}
        </Text>
        <ChangeLabel change={change} caption="30일" />
      </View>
    </View>
  );
}

export default function PortfolioChangeScreen() {
  const isDesktop = useIsDesktop();
  const { data: summary } = useAssetSummary();
  const { data: trend = [], isLoading } = useAssetTrend(30);
  const [trendChartWidth, setTrendChartWidth] = useState(0);

  const currentTotal = summary?.totalValue ?? 0;
  const startSnapshot = trend.length > 1 ? trend[0] : null;
  const startTotal = startSnapshot?.totalValue ?? 0;
  const periodChange = startSnapshot ? computeChange(startTotal, currentTotal) : null;

  const trendPoints = useMemo(
    () =>
      trend.map((snapshot) => {
        const [, month, day] = snapshot.date.split('-');
        return { key: snapshot.date, label: `${month}.${day}`, value: snapshot.totalValue };
      }),
    [trend],
  );

  // 스냅샷은 자산 유형별 합계만 기록하므로, 개별 자산이 아니라 유형 단위로 시작 시점 대비
  // 지금 값을 비교해 어느 유형이 얼마나 올랐는지(또는 내렸는지) 보여준다.
  const typeChanges = useMemo(() => {
    const startByType = new Map((startSnapshot?.byType ?? []).map((item) => [item.type, item.amount]));
    const currentByType = new Map((summary?.byType ?? []).map((item) => [item.type, item.amount]));
    return ASSET_TYPE_ORDER.map((type) => ({
      type,
      start: startByType.get(type) ?? 0,
      current: currentByType.get(type) ?? 0,
    }))
      .filter((item) => item.start !== 0 || item.current !== 0)
      .sort((a, b) => Math.abs(b.current - b.start) - Math.abs(a.current - a.start));
  }, [startSnapshot, summary]);

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[720px]' : 'max-w-[480px]'}>
      <Link href="/portfolio" className="self-start text-sm font-medium text-primary dark:text-secondary">
        ‹ 자산 개요로
      </Link>

      <View className="gap-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">최근 30일 변동</Text>
        {trendPoints.length > 1 ? (
          <Text className="text-xs text-slate-400">
            {trendPoints[0].label} ~ {trendPoints[trendPoints.length - 1].label}
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <>
          <View className="gap-4 rounded-3xl bg-white p-5 dark:bg-slate-900">
            <View className="gap-1">
              <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">총 자산 변동</Text>
              <Text className="text-2xl font-bold text-slate-900 dark:text-white" numberOfLines={1} adjustsFontSizeToFit>
                {periodChange
                  ? `${periodChange.amount >= 0 ? '+' : ''}${formatKrw(Math.round(periodChange.amount))}`
                  : '-'}
              </Text>
              <ChangeLabel change={periodChange} caption="30일 전 대비" />
            </View>

            <View className="gap-2" onLayout={(e) => setTrendChartWidth(e.nativeEvent.layout.width)}>
              {trendPoints.length > 1 && trendChartWidth > 0 ? (
                <TrendLineChart data={trendPoints} width={trendChartWidth} formatValue={formatKrw} />
              ) : (
                <Text className="text-xs text-slate-400">
                  매일 자정에 자산 스냅샷을 기록해요. 며칠 지나면 여기에 추이 그래프가 나타나요.
                </Text>
              )}
            </View>
          </View>

          {typeChanges.length > 0 ? (
            <View className="gap-3">
              <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">유형별 변동 내역</Text>
              <View className="gap-2">
                {typeChanges.map((item) => (
                  <TypeChangeRow key={item.type} type={item.type} start={item.start} current={item.current} />
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}
