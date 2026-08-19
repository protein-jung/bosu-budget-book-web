import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { Screen } from '@/components/Screen';
import { useAssets, useAssetSummary, useAssetTrend, useRefreshAssetPrices } from '@/features/asset/api';
import { AssetFormModal } from '@/features/asset/AssetFormModal';
import { formatCompactKrw, formatKrw } from '@/lib/format';
import { ASSET_TYPE_META, CASH_CATEGORY_META, LOAN_REPAYMENT_TYPE_META, REAL_ESTATE_CATEGORY_META } from '@/lib/palette';
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

/** 소수점 둘째 자리까지 반올림하고 불필요한 0을 잘라낸다(금/은 중량 표시용). */
function trimTrailingZeros(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, '') || '0';
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
  if (asset.type === 'REAL_ESTATE' && asset.realEstateCategory != null && asset.realEstateCategory !== 'OWNED') {
    return null;
  }
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

type Change = { amount: number; rate: number };

function computeChange(from: number, to: number): Change | null {
  if (from === 0) return null;
  return { amount: to - from, rate: ((to - from) / from) * 100 };
}

function ChangeLabel({ change, caption }: { change: Change | null; caption: string }) {
  if (!change) {
    return <Text className="text-xs text-slate-400">데이터가 더 쌓이면 표시돼요</Text>;
  }
  if (change.rate === 0) {
    return (
      <Text className="text-xs font-semibold text-slate-400">
        변동 없음 <Text className="text-xs font-normal text-slate-400">{caption}</Text>
      </Text>
    );
  }
  const positive = change.rate > 0;
  return (
    <Text className={`text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
      {positive ? '▲' : '▼'} {positive ? '+' : ''}
      {change.rate.toFixed(2)}%{' '}
      <Text className="text-xs font-normal text-slate-400">{caption}</Text>
    </Text>
  );
}

function CompositionBar({ type, pct, amount, wide }: { type: AssetType; pct: number; amount: number; wide?: boolean }) {
  const meta = ASSET_TYPE_META[type];
  return (
    <Link href={{ pathname: '/portfolio/[type]', params: { type } }} asChild>
      <Pressable className={`grow gap-1.5 ${wide ? 'basis-[18%]' : 'basis-[45%]'}`}>
        <View className="flex-row items-baseline justify-between gap-1">
          <Text className="text-xs font-medium text-slate-500 dark:text-slate-400" numberOfLines={1}>
            {meta.icon} {meta.label}
          </Text>
          <Text className="text-xs font-medium text-slate-400" numberOfLines={1}>
            {formatCompactKrw(amount)}원
          </Text>
        </View>
        <Text className="text-lg font-bold text-slate-900 dark:text-white">{Math.round(pct)}%</Text>
        <View className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <View className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: meta.color }} />
        </View>
      </Pressable>
    </Link>
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
      const realEstateCategory = asset.realEstateCategory ?? 'OWNED';
      subtitleParts.push(REAL_ESTATE_CATEGORY_META[realEstateCategory].label);
      if (realEstateCategory === 'OWNED') {
        if (asset.manualValue != null) subtitleParts.push(`원금 ${formatKrw(asset.manualValue)}`);
        if (asset.currentPrice != null) subtitleParts.push(`실거래가 ${formatKrw(asset.currentPrice)}`);
      } else {
        if (asset.manualValue != null) {
          subtitleParts.push(`${REAL_ESTATE_CATEGORY_META[realEstateCategory].valueLabel} ${formatKrw(asset.manualValue)}`);
        }
        if (realEstateCategory === 'WOLSE' && asset.monthlyRent != null) {
          subtitleParts.push(`월세 ${formatKrw(asset.monthlyRent)}`);
        }
      }
    }
    if (asset.type === 'VEHICLE') {
      if (asset.manualValue != null) subtitleParts.push(`구매가 ${formatKrw(asset.manualValue)}`);
      if (asset.purchaseDate) subtitleParts.push(`${asset.purchaseDate} 구매`);
      if (asset.currentPrice != null) subtitleParts.push(`엔카 매물 평균 ${formatKrw(asset.currentPrice)}`);
    }
    if (asset.type === 'GOLD' || asset.type === 'SILVER') {
      if (asset.quantity != null) {
        const don = asset.quantity / 3.75;
        subtitleParts.push(`${trimTrailingZeros(asset.quantity)}g (${trimTrailingZeros(don)}돈)`);
      }
      if (asset.currentPrice != null) subtitleParts.push(`${formatKrw(asset.currentPrice)}/g`);
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

  const currentTotal = summary?.totalValue ?? 0;

  const trendPoints = useMemo(
    () =>
      trend.map((snapshot) => {
        const [, month, day] = snapshot.date.split('-');
        return { key: snapshot.date, label: `${month}.${day}`, value: snapshot.totalValue };
      }),
    [trend],
  );

  // "오늘"은 가장 최근 스냅샷(전날 자정 기준) 대비 지금 이 순간의 실시간 총액 변화,
  // "최근 30일"은 조회 기간 중 가장 오래된 스냅샷 대비 변화 — 스냅샷이 1개뿐이면 아직 기간
  // 비교를 할 수 없으므로 null.
  const todayChange = useMemo(
    () => (trend.length > 0 ? computeChange(trend[trend.length - 1].totalValue, currentTotal) : null),
    [trend, currentTotal],
  );
  const periodChange = useMemo(
    () => (trend.length > 1 ? computeChange(trend[0].totalValue, currentTotal) : null),
    [trend, currentTotal],
  );

  // 자산 구성 비율은 보유 중인 자산(양수)만 대상으로 한다 — 대출은 빚이지 보유 구성이 아니라서 제외.
  const compositionData = useMemo(() => {
    const positive = (summary?.byType ?? []).filter((item) => item.type !== 'LOAN' && item.amount > 0);
    const positiveTotal = positive.reduce((sum, item) => sum + item.amount, 0);
    if (positiveTotal === 0) return [];
    return positive
      .map((item) => ({ type: item.type, pct: (item.amount / positiveTotal) * 100, amount: item.amount }))
      .sort((a, b) => b.pct - a.pct);
  }, [summary]);

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

  const overviewSection = (
    <View className="gap-5 rounded-3xl bg-white p-5 dark:bg-slate-900">
      <View className="flex-row items-center justify-between">
        <View className="gap-0.5">
          <Text className="text-lg font-bold text-slate-900 dark:text-white">포트폴리오 개요</Text>
          <Text className="text-xs text-slate-400">
            {refreshError
              ? '시세 갱신에 실패했어요. 다시 시도해주세요.'
              : (minutesAgoLabel(lastRefreshedAt) ?? '시세 갱신 전')}
          </Text>
        </View>
        <Pressable
          onPress={handleRefresh}
          disabled={refreshPrices.isPending}
          className="flex-row items-center gap-2 rounded-full bg-slate-200 px-4 py-2 dark:bg-slate-800">
          {refreshPrices.isPending ? <ActivityIndicator size="small" /> : null}
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">새로고침</Text>
        </Pressable>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 gap-1 rounded-2xl bg-cream p-4 dark:bg-slate-800">
          <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">총 자산</Text>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white" numberOfLines={1} adjustsFontSizeToFit>
            {formatKrw(currentTotal)}
          </Text>
          <ChangeLabel change={todayChange} caption="오늘" />
        </View>
        <View className="flex-1 gap-1 rounded-2xl bg-cream p-4 dark:bg-slate-800">
          <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">최근 30일</Text>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white" numberOfLines={1} adjustsFontSizeToFit>
            {periodChange
              ? `${periodChange.amount >= 0 ? '+' : ''}${formatKrw(Math.round(periodChange.amount))}`
              : '-'}
          </Text>
          <ChangeLabel change={periodChange} caption="30일 전 대비" />
        </View>
      </View>

      {compositionData.length > 0 ? (
        <View className="gap-3">
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">자산 구성</Text>
          <View className="flex-row flex-wrap gap-4">
            {compositionData.map((item) => (
              <CompositionBar key={item.type} type={item.type} pct={item.pct} amount={item.amount} wide={isDesktop} />
            ))}
          </View>
        </View>
      ) : null}

      <View className="gap-2" onLayout={(e) => setTrendChartWidth(e.nativeEvent.layout.width)}>
        <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">최근 30일 자산 추이</Text>
        {trendPoints.length > 1 && trendChartWidth > 0 ? (
          <TrendLineChart data={trendPoints} width={trendChartWidth} formatValue={formatKrw} />
        ) : (
          <Text className="text-xs text-slate-400">
            매일 자정에 자산 스냅샷을 기록해요. 며칠 지나면 여기에 추이 그래프가 나타나요.
          </Text>
        )}
      </View>
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
    </View>
  );

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[1100px]' : 'max-w-[480px]'}>
      {overviewSection}

      <Pressable onPress={() => setEditing(null)} className="items-center rounded-xl bg-primary p-4">
        <Text className="font-semibold text-white">+ 자산 추가</Text>
      </Pressable>

      {listColumn}

      <AssetFormModal visible={editing !== undefined} onClose={() => setEditing(undefined)} asset={editing} />
    </Screen>
  );
}
