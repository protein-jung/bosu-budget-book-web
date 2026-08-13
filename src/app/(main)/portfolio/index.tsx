import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { DonutChart } from '@/components/charts/DonutChart';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { Screen } from '@/components/Screen';
import { useAssets, useAssetSummary, useAssetTrend, useRefreshAssetPrices } from '@/features/asset/api';
import { AssetFormModal } from '@/features/asset/AssetFormModal';
import { formatKrw } from '@/lib/format';
import { ASSET_TYPE_META, CASH_CATEGORY_META, LOAN_REPAYMENT_TYPE_META } from '@/lib/palette';
import { useIsDesktop } from '@/lib/responsive';
import type { Asset, AssetType } from '@/lib/types';

const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;
const ASSET_TYPE_ORDER = Object.keys(ASSET_TYPE_META) as AssetType[];
const HOUSEHOLD_TYPES: AssetType[] = ['REAL_ESTATE', 'VEHICLE'];
const PERSONAL_ASSET_TYPES = ASSET_TYPE_ORDER.filter((type) => !HOUSEHOLD_TYPES.includes(type));

type TypeGroup = {
  type: AssetType;
  items: Asset[];
  typeTotal: number;
  custodianGroups: { custodian: string; items: Asset[]; total: number }[];
  ungrouped: Asset[];
};

function buildTypeGroups(assets: Asset[], types: AssetType[]): TypeGroup[] {
  const sortByValueDesc = (items: Asset[]) =>
    [...items].sort((a, b) => (b.currentValue ?? -Infinity) - (a.currentValue ?? -Infinity));

  const byType = new Map<AssetType, Asset[]>();
  for (const asset of assets) {
    const list = byType.get(asset.type) ?? [];
    list.push(asset);
    byType.set(asset.type, list);
  }
  return types
    .map((type) => {
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
}

function minutesAgoLabel(date: Date | null) {
  if (!date) return null;
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return '방금 갱신';
  return `${minutes}분 전 갱신`;
}

function formatYearsMonths(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months}개월`;
  if (months === 0) return `${years}년`;
  return `${years}년 ${months}개월`;
}

/** loanStartMonth(YYYY-MM-DD)부터 오늘까지 경과한 개월 수. 일(day)은 무시하고 연-월만 비교한다. */
function elapsedMonthsSince(startDateKey: string): number {
  const [startYear, startMonth] = startDateKey.split('-').map(Number);
  const now = new Date();
  return (now.getFullYear() - startYear) * 12 + (now.getMonth() + 1 - startMonth);
}

function computeGainDetail(asset: Asset): { gain: number; costBasis: number } | null {
  if (asset.type === 'REAL_ESTATE' || asset.type === 'VEHICLE') {
    if (asset.manualValue == null || asset.manualValue === 0 || asset.currentPrice == null) return null;
    return { gain: asset.currentPrice - asset.manualValue, costBasis: asset.manualValue };
  }
  if (asset.averagePrice == null || asset.currentPrice == null || asset.quantity == null) return null;
  const costBasis = asset.averagePrice * asset.quantity;
  if (costBasis === 0) return null;
  const currentValue = asset.currentPrice * asset.quantity;
  return { gain: currentValue - costBasis, costBasis };
}

function computeGain(asset: Asset): { gain: number; rate: number } | null {
  const detail = computeGainDetail(asset);
  return detail ? { gain: detail.gain, rate: (detail.gain / detail.costBasis) * 100 } : null;
}

/** 예금/적금 카드에 붙는 실시간 이자 표시. 1초마다 다시 계산해서, 시작일부터 지금까지 단리로
 * 늘어난 이자와 만기 예상 수령액을 보여준다. */
function LiveCashInterest({ asset }: { asset: Asset }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { manualValue, cashInterestRate, cashStartDate, maturityDate } = asset;
  if (manualValue == null || cashInterestRate == null || !cashStartDate) return null;

  const startMs = new Date(cashStartDate).getTime();
  const maturityMs = maturityDate ? new Date(maturityDate).getTime() : null;
  const elapsedMs = Math.max((maturityMs != null ? Math.min(now, maturityMs) : now) - startMs, 0);
  if (elapsedMs <= 0) return null;

  const rate = cashInterestRate / 100;
  const accrued = manualValue * rate * (elapsedMs / MS_PER_YEAR);
  const dailyAccrual = manualValue * rate * (1 / 365);
  const maturityAmount =
    maturityMs != null ? manualValue * (1 + rate * ((maturityMs - startMs) / MS_PER_YEAR)) : null;

  return (
    <View className="mt-1 gap-0.5">
      <Text className="text-xs font-medium text-emerald-600">
        지금까지 이자 +{formatKrw(Math.round(accrued))} (하루 +{formatKrw(Math.round(dailyAccrual))})
      </Text>
      {maturityAmount != null ? (
        <Text className="text-xs text-slate-400">만기 시 {formatKrw(Math.round(maturityAmount))} 수령 예정</Text>
      ) : null}
    </View>
  );
}

export default function AssetsScreen() {
  const { data: assets = [], isLoading } = useAssets();
  const { data: summary } = useAssetSummary();
  const { data: trend = [] } = useAssetTrend(30);
  const refreshPrices = useRefreshAssetPrices();
  const isDesktop = useIsDesktop();
  const [trendChartWidth, setTrendChartWidth] = useState(0);
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
    if (asset.type === 'REAL_ESTATE') {
      if (asset.manualValue != null) subtitleParts.push(`원금 ${formatKrw(asset.manualValue)}`);
      if (asset.currentPrice != null) subtitleParts.push(`실거래가 ${formatKrw(asset.currentPrice)}`);
    }
    if (asset.type === 'VEHICLE') {
      if (asset.manualValue != null) subtitleParts.push(`구매가 ${formatKrw(asset.manualValue)}`);
      if (asset.purchaseDate) subtitleParts.push(`${asset.purchaseDate} 구매`);
      if (asset.currentPrice != null) subtitleParts.push(`엔카 매물 평균 ${formatKrw(asset.currentPrice)}`);
    }
    if (asset.type === 'LOAN') {
      if (asset.loanPrincipal != null) subtitleParts.push(`원금 ${formatKrw(asset.loanPrincipal)}`);
      if (asset.loanInterestRate != null) subtitleParts.push(`연 ${asset.loanInterestRate}%`);
      if (asset.loanRepaymentType) subtitleParts.push(LOAN_REPAYMENT_TYPE_META[asset.loanRepaymentType].shortLabel);
      if (asset.currentMonthlyPayment != null) subtitleParts.push(`이번달 ${formatKrw(asset.currentMonthlyPayment)}`);
      if (asset.loanTermMonths != null) subtitleParts.push(`총 ${formatYearsMonths(asset.loanTermMonths)}`);
      if (asset.loanStartMonth && asset.loanTermMonths != null) {
        const elapsed = Math.max(0, Math.min(elapsedMonthsSince(asset.loanStartMonth), asset.loanTermMonths));
        subtitleParts.push(`잔여 ${formatYearsMonths(asset.loanTermMonths - elapsed)}`);
      }
    }
    if (asset.type === 'STOCK' && !asset.symbol) subtitleParts.push('현금성 자산');
    if (asset.type === 'STOCK' && asset.accountCategory === 'PENSION') subtitleParts.push('연금');
    if (asset.type === 'CASH' && asset.cashCategory) {
      subtitleParts.push(CASH_CATEGORY_META[asset.cashCategory].label);
      if (asset.maturityDate) {
        subtitleParts.push(asset.matured ? `만기 ${asset.maturityDate} (만기됨)` : `만기 ${asset.maturityDate}`);
      }
    }
    return (
      <Pressable
        key={asset.id}
        onPress={() => setEditing(asset)}
        className={`flex-row items-center justify-between rounded-xl bg-white p-4 dark:bg-slate-900 ${
          asset.matured ? 'opacity-50' : ''
        }`}>
        <View className="flex-1 gap-0.5">
          <Text className="font-medium text-slate-900 dark:text-white">{asset.name}</Text>
          {subtitleParts.length > 0 ? (
            <Text className="text-xs text-slate-400">{subtitleParts.join(' · ')}</Text>
          ) : null}
          {asset.type === 'CASH' && asset.cashCategory !== 'ACCOUNT' ? <LiveCashInterest asset={asset} /> : null}
        </View>
        <View className="items-end gap-0.5">
          <Text
            className={`font-semibold ${
              asset.currentValue != null && asset.currentValue < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-900 dark:text-white'
            }`}>
            {asset.currentValue == null
              ? '시세 대기중'
              : asset.type === 'LOAN'
                ? `잔액 ${formatKrw(Math.abs(asset.currentValue))}`
                : formatKrw(asset.currentValue)}
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

  const totalGain = useMemo(() => {
    let gain = 0;
    let costBasis = 0;
    for (const asset of assets) {
      const detail = computeGainDetail(asset);
      if (!detail) continue;
      gain += detail.gain;
      costBasis += detail.costBasis;
    }
    return costBasis === 0 ? null : { gain, rate: (gain / costBasis) * 100 };
  }, [assets]);

  const trendPoints = useMemo(
    () =>
      trend.map((snapshot) => {
        const [, month, day] = snapshot.date.split('-');
        return { key: snapshot.date, label: `${month}.${day}`, value: snapshot.totalValue };
      }),
    [trend],
  );

  const donutData = useMemo(
    () =>
      (summary?.byType ?? [])
        .filter((item) => item.amount > 0)
        .map((item) => ({ key: item.type, value: item.amount, color: ASSET_TYPE_META[item.type].color })),
    [summary],
  );

  const householdGroups = useMemo(
    () => buildTypeGroups(assets.filter((asset) => HOUSEHOLD_TYPES.includes(asset.type)), HOUSEHOLD_TYPES),
    [assets],
  );

  const ownerGroups = useMemo(() => {
    const personalAssets = assets.filter((asset) => !HOUSEHOLD_TYPES.includes(asset.type));
    const byOwner = new Map<string, { ownerUserId: number | null; assets: Asset[] }>();
    for (const asset of personalAssets) {
      const key = asset.ownerName ?? '미지정';
      const entry = byOwner.get(key) ?? { ownerUserId: asset.ownerUserId, assets: [] };
      entry.assets.push(asset);
      byOwner.set(key, entry);
    }
    return Array.from(byOwner.entries())
      .map(([ownerName, { ownerUserId, assets: ownerAssets }]) => ({
        ownerName,
        ownerUserId,
        typeGroups: buildTypeGroups(ownerAssets, PERSONAL_ASSET_TYPES),
        total: ownerAssets.reduce((sum, a) => sum + (a.currentValue ?? 0), 0),
      }))
      // 자산 총액이 갱신될 때마다 카드 순서가 바뀌지 않도록, 값이 아니라 소유주(가입 순서)로 고정 정렬한다.
      .sort((a, b) => (a.ownerUserId ?? Infinity) - (b.ownerUserId ?? Infinity));
  }, [assets]);

  const summaryColumn = (
    <View className="gap-5">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">자산</Text>
        <Text className="text-3xl font-bold text-primary">{formatKrw(summary?.totalValue ?? 0)}</Text>
        {totalGain ? (
          <Text className={`text-sm font-semibold ${totalGain.gain >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {totalGain.gain >= 0 ? '▲' : '▼'} {totalGain.gain >= 0 ? '+' : ''}
            {formatKrw(Math.round(totalGain.gain))} ({totalGain.rate >= 0 ? '+' : ''}
            {totalGain.rate.toFixed(1)}%)
          </Text>
        ) : null}
      </View>

      <View
        className="gap-2 rounded-xl bg-white p-4 dark:bg-slate-900"
        onLayout={(e) => setTrendChartWidth(e.nativeEvent.layout.width - 32)}>
        <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">최근 30일 자산 추이</Text>
        {trendPoints.length > 1 && trendChartWidth > 0 ? (
          <TrendLineChart data={trendPoints} width={trendChartWidth} formatValue={formatKrw} />
        ) : (
          <Text className="text-xs text-slate-400">
            매일 자정에 자산 스냅샷을 기록해요. 며칠 지나면 여기에 추이 그래프가 나타나요.
          </Text>
        )}
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

  const renderTypeGroup = (group: TypeGroup, wide?: boolean) => (
    <View key={group.type} className={`gap-3 ${wide && isDesktop ? 'w-[48%]' : ''}`}>
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
      {group.ungrouped.length > 0 ? <View className="gap-2">{group.ungrouped.map(renderAssetRow)}</View> : null}
    </View>
  );

  const listColumn = (
    <View className="gap-6">
      {isLoading ? (
        <ActivityIndicator />
      ) : assets.length === 0 ? (
        <Text className="py-6 text-center text-slate-400">등록된 자산이 없습니다.</Text>
      ) : (
        <>
          {householdGroups.length > 0 ? (
            <View className={isDesktop ? 'flex-row flex-wrap gap-5' : 'gap-5'}>
              {householdGroups.map((group) => renderTypeGroup(group, true))}
            </View>
          ) : null}

          {ownerGroups.length > 0 ? (
            <View className={isDesktop ? 'flex-row flex-wrap gap-5' : 'gap-5'}>
              {ownerGroups.map((owner) => (
                <View
                  key={owner.ownerName}
                  className={`gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700 ${
                    isDesktop ? 'w-[48%]' : ''
                  }`}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-slate-900 dark:text-white">{owner.ownerName}</Text>
                    <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {formatKrw(owner.total)}
                    </Text>
                  </View>
                  <View className="gap-5">{owner.typeGroups.map((group) => renderTypeGroup(group))}</View>
                </View>
              ))}
            </View>
          ) : null}
        </>
      )}

      {!isDesktop ? (
        <Pressable onPress={() => setEditing(null)} className="items-center rounded-xl bg-primary p-4">
          <Text className="font-semibold text-white">+ 자산 추가</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[1600px]' : 'max-w-[480px]'}>
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
