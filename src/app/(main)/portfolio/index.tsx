import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { DonutChart } from '@/components/charts/DonutChart';
import { Screen } from '@/components/Screen';
import { useAssets, useAssetSummary, useRefreshAssetPrices } from '@/features/asset/api';
import { AssetFormModal } from '@/features/asset/AssetFormModal';
import { formatKrw } from '@/lib/format';
import { ASSET_TYPE_META } from '@/lib/palette';
import type { Asset, AssetType } from '@/lib/types';

const ASSET_TYPE_ORDER = Object.keys(ASSET_TYPE_META) as AssetType[];

function minutesAgoLabel(date: Date | null) {
  if (!date) return null;
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return '방금 갱신';
  return `${minutes}분 전 갱신`;
}

export default function AssetsScreen() {
  const { data: assets = [], isLoading } = useAssets();
  const { data: summary } = useAssetSummary();
  const refreshPrices = useRefreshAssetPrices();
  const [editing, setEditing] = useState<Asset | null | undefined>(undefined);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [hasAutoRefreshed, setHasAutoRefreshed] = useState(false);

  useEffect(() => {
    if (hasAutoRefreshed || assets.length === 0) return;
    setHasAutoRefreshed(true);
    refreshPrices.mutate(undefined, { onSuccess: () => setLastRefreshedAt(new Date()) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAutoRefreshed, assets.length]);

  const handleRefresh = () => {
    refreshPrices.mutate(undefined, { onSuccess: () => setLastRefreshedAt(new Date()) });
  };

  const donutData = useMemo(
    () =>
      (summary?.byType ?? [])
        .filter((item) => item.amount > 0)
        .map((item) => ({ key: item.type, value: item.amount, color: ASSET_TYPE_META[item.type].color })),
    [summary],
  );

  const groupedAssets = useMemo(() => {
    const map = new Map<AssetType, Asset[]>();
    for (const asset of assets) {
      const list = map.get(asset.type) ?? [];
      list.push(asset);
      map.set(asset.type, list);
    }
    return ASSET_TYPE_ORDER.map((type) => ({ type, items: map.get(type) ?? [] })).filter(
      (group) => group.items.length > 0,
    );
  }, [assets]);

  return (
    <Screen>
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
        <Text className="text-xs text-slate-400">{minutesAgoLabel(lastRefreshedAt) ?? '시세 갱신 전'}</Text>
        <Pressable
          onPress={handleRefresh}
          disabled={refreshPrices.isPending}
          className="flex-row items-center gap-2 rounded-full bg-slate-200 px-4 py-2 dark:bg-slate-800">
          {refreshPrices.isPending ? <ActivityIndicator size="small" /> : null}
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">새로고침</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : assets.length === 0 ? (
        <Text className="py-6 text-center text-slate-400">등록된 자산이 없습니다.</Text>
      ) : (
        <View className="gap-5">
          {groupedAssets.map((group) => (
            <View key={group.type} className="gap-2">
              <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {ASSET_TYPE_META[group.type].icon} {ASSET_TYPE_META[group.type].label}
              </Text>
              {group.items.map((asset) => (
                <Pressable
                  key={asset.id}
                  onPress={() => setEditing(asset)}
                  className="flex-row items-center justify-between rounded-xl bg-white p-4 dark:bg-slate-900">
                  <View className="flex-1 gap-0.5">
                    <Text className="font-medium text-slate-900 dark:text-white">{asset.name}</Text>
                    <Text className="text-xs text-slate-400">
                      {asset.custodian ? asset.custodian : '보관처 미지정'}
                      {asset.symbol
                        ? ` · ${asset.symbol} · ${asset.quantity}개${
                            asset.currentPrice ? ` · ${formatKrw(asset.currentPrice)}` : ''
                          }`
                        : ''}
                    </Text>
                  </View>
                  <Text className="font-semibold text-slate-900 dark:text-white">
                    {asset.currentValue != null ? formatKrw(asset.currentValue) : '시세 대기중'}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      )}

      <Pressable onPress={() => setEditing(null)} className="items-center rounded-xl bg-primary p-4">
        <Text className="font-semibold text-white">+ 자산 추가</Text>
      </Pressable>

      <AssetFormModal visible={editing !== undefined} onClose={() => setEditing(undefined)} asset={editing} />
    </Screen>
  );
}
