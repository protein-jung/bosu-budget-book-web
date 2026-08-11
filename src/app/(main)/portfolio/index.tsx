import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { DonutChart } from '@/components/charts/DonutChart';
import { Screen } from '@/components/Screen';
import { useAssets, useAssetSummary, useRefreshAssetPrices } from '@/features/asset/api';
import { AssetFormModal } from '@/features/asset/AssetFormModal';
import { formatKrw } from '@/lib/format';
import { ASSET_TYPE_META } from '@/lib/palette';
import { useIsDesktop } from '@/lib/responsive';
import type { Asset, AssetType } from '@/lib/types';

const ASSET_TYPE_ORDER = Object.keys(ASSET_TYPE_META) as AssetType[];

function minutesAgoLabel(date: Date | null) {
  if (!date) return null;
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return '방금 갱신';
  return `${minutes}분 전 갱신`;
}

function computeGain(asset: Asset): { gain: number; rate: number } | null {
  if (asset.averagePrice == null || asset.currentPrice == null || asset.quantity == null) return null;
  const costBasis = asset.averagePrice * asset.quantity;
  if (costBasis === 0) return null;
  const currentValue = asset.currentPrice * asset.quantity;
  const gain = currentValue - costBasis;
  return { gain, rate: (gain / costBasis) * 100 };
}

export default function AssetsScreen() {
  const { data: assets = [], isLoading } = useAssets();
  const { data: summary } = useAssetSummary();
  const refreshPrices = useRefreshAssetPrices();
  const isDesktop = useIsDesktop();
  const [editing, setEditing] = useState<Asset | null | undefined>(undefined);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [hasAutoRefreshed, setHasAutoRefreshed] = useState(false);
  const [refreshError, setRefreshError] = useState(false);

  useEffect(() => {
    if (hasAutoRefreshed || assets.length === 0) return;
    setHasAutoRefreshed(true);
    refreshPrices.mutate(undefined, {
      onSuccess: () => {
        setRefreshError(false);
        setLastRefreshedAt(new Date());
      },
      onError: () => setRefreshError(true),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAutoRefreshed, assets.length]);

  const handleRefresh = () => {
    refreshPrices.mutate(undefined, {
      onSuccess: () => {
        setRefreshError(false);
        setLastRefreshedAt(new Date());
      },
      onError: () => setRefreshError(true),
    });
  };

  const renderAssetRow = (asset: Asset) => {
    const gainInfo = computeGain(asset);
    const subtitleParts: string[] = [];
    if (asset.symbol) {
      subtitleParts.push(asset.symbol, `${asset.quantity}개`);
      if (asset.averagePrice != null) subtitleParts.push(`매입 ${formatKrw(asset.averagePrice)}`);
      if (asset.currentPrice != null) subtitleParts.push(`현재 ${formatKrw(asset.currentPrice)}`);
    }
    if (asset.type === 'REAL_ESTATE' && asset.currentPrice != null) {
      subtitleParts.push(`실거래가 ${formatKrw(asset.currentPrice)}`);
    }
    if (asset.type === 'STOCK' && asset.accountCategory === 'PENSION') subtitleParts.push('연금');
    if (asset.type !== 'REAL_ESTATE' && asset.type !== 'VEHICLE' && asset.ownerName) {
      subtitleParts.push(asset.ownerName);
    }

    return (
      <Pressable
        key={asset.id}
        onPress={() => setEditing(asset)}
        className="flex-row items-center justify-between rounded-xl bg-white p-4 dark:bg-slate-900">
        <View className="flex-1 gap-0.5">
          <Text className="font-medium text-slate-900 dark:text-white">{asset.name}</Text>
          {subtitleParts.length > 0 ? (
            <Text className="text-xs text-slate-400">{subtitleParts.join(' · ')}</Text>
          ) : null}
        </View>
        <View className="items-end gap-0.5">
          <Text className="font-semibold text-slate-900 dark:text-white">
            {asset.currentValue != null ? formatKrw(asset.currentValue) : '시세 대기중'}
          </Text>
          {gainInfo ? (
            <Text className={`text-xs font-medium ${gainInfo.gain >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {gainInfo.gain >= 0 ? '▲' : '▼'} {gainInfo.gain >= 0 ? '+' : ''}
              {formatKrw(Math.round(gainInfo.gain))} ({gainInfo.rate >= 0 ? '+' : ''}
              {gainInfo.rate.toFixed(1)}%)
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const donutData = useMemo(
    () =>
      (summary?.byType ?? [])
        .filter((item) => item.amount > 0)
        .map((item) => ({ key: item.type, value: item.amount, color: ASSET_TYPE_META[item.type].color })),
    [summary],
  );

  const groupedAssets = useMemo(() => {
    const sortByValueDesc = (items: Asset[]) =>
      [...items].sort((a, b) => (b.currentValue ?? -Infinity) - (a.currentValue ?? -Infinity));

    const byType = new Map<AssetType, Asset[]>();
    for (const asset of assets) {
      const list = byType.get(asset.type) ?? [];
      list.push(asset);
      byType.set(asset.type, list);
    }
    return ASSET_TYPE_ORDER.map((type) => {
      const items = byType.get(type) ?? [];
      const custodianMap = new Map<string, Asset[]>();
      const ungrouped: Asset[] = [];
      for (const asset of items) {
        if (asset.custodian) {
          const list = custodianMap.get(asset.custodian) ?? [];
          list.push(asset);
          custodianMap.set(asset.custodian, list);
        } else {
          ungrouped.push(asset);
        }
      }
      const custodianGroups = Array.from(custodianMap.entries())
        .map(([custodian, groupItems]) => ({
          custodian,
          items: sortByValueDesc(groupItems),
          total: groupItems.reduce((sum, a) => sum + (a.currentValue ?? 0), 0),
        }))
        .sort((a, b) => b.total - a.total);
      const typeTotal = items.reduce((sum, a) => sum + (a.currentValue ?? 0), 0);
      return { type, items, typeTotal, custodianGroups, ungrouped: sortByValueDesc(ungrouped) };
    })
      .filter((group) => group.items.length > 0)
      .sort((a, b) => b.typeTotal - a.typeTotal);
  }, [assets]);

  const summaryColumn = (
    <View className="gap-5">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">자산</Text>
        <Text className="text-3xl font-bold text-primary">{formatKrw(summary?.totalValue ?? 0)}</Text>
      </View>

      {donutData.length > 0 ? (
        <View className="items-center gap-3">
          <DonutChart data={donutData}>
            <Text className="text-xs text-slate-400">총 자산</Text>
          </DonutChart>
          <View className="flex-row flex-wrap justify-center gap-3">
            {donutData.map((d) => (
              <View key={d.key} className="flex-row items-center gap-1.5">
                <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {ASSET_TYPE_META[d.key as AssetType].label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-slate-400">
          {refreshError ? '시세 갱신에 실패했어요. 다시 시도해주세요.' : (minutesAgoLabel(lastRefreshedAt) ?? '시세 갱신 전')}
        </Text>
        <Pressable
          onPress={handleRefresh}
          disabled={refreshPrices.isPending}
          className="flex-row items-center gap-2 rounded-full bg-slate-200 px-4 py-2 dark:bg-slate-800">
          {refreshPrices.isPending ? <ActivityIndicator size="small" /> : null}
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">새로고침</Text>
        </Pressable>
      </View>

      {isDesktop ? (
        <Pressable onPress={() => setEditing(null)} className="items-center rounded-xl bg-primary p-4">
          <Text className="font-semibold text-white">+ 자산 추가</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const listColumn = (
    <View className="gap-5">
      {isLoading ? (
        <ActivityIndicator />
      ) : assets.length === 0 ? (
        <Text className="py-6 text-center text-slate-400">등록된 자산이 없습니다.</Text>
      ) : (
        <View className={isDesktop ? 'flex-row flex-wrap gap-5' : 'gap-5'}>
          {groupedAssets.map((group) => (
            <View key={group.type} className={`gap-3 ${isDesktop ? 'w-[48%]' : ''}`}>
              <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {ASSET_TYPE_META[group.type].icon} {ASSET_TYPE_META[group.type].label}
              </Text>
              {group.custodianGroups.map((custodianGroup) => (
                <View key={custodianGroup.custodian} className="gap-2">
                  <View className="flex-row items-center justify-between px-1">
                    <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {custodianGroup.custodian}
                    </Text>
                    <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {formatKrw(custodianGroup.total)}
                    </Text>
                  </View>
                  {custodianGroup.items.map(renderAssetRow)}
                </View>
              ))}
              {group.ungrouped.length > 0 ? (
                <View className="gap-2">{group.ungrouped.map(renderAssetRow)}</View>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {!isDesktop ? (
        <Pressable onPress={() => setEditing(null)} className="items-center rounded-xl bg-primary p-4">
          <Text className="font-semibold text-white">+ 자산 추가</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[1100px]' : 'max-w-[480px]'}>
      {isDesktop ? (
        <View className="flex-row items-start gap-6">
          <View className="w-[360px]">{summaryColumn}</View>
          <View className="flex-1">{listColumn}</View>
        </View>
      ) : (
        <>
          {summaryColumn}
          {listColumn}
        </>
      )}

      <AssetFormModal visible={editing !== undefined} onClose={() => setEditing(undefined)} asset={editing} />
    </Screen>
  );
}
