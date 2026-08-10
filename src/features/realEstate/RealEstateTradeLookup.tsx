import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { getErrorMessage } from '@/lib/apiClient';
import { formatKrw } from '@/lib/format';
import type { RealEstateTrade } from '@/lib/types';

import { useSearchRealEstateTrades } from './api';

function dealYmOf(dateKey: string) {
  return dateKey.slice(0, 7).replace('-', '');
}

// 국토교통부 실거래가는 동(건물번호)까지는 공개하지만 호수는 사생활 보호 때문에 공개하지 않고
// 층수만 알려준다. 그래서 호수는 "마지막 두 자리를 뺀 나머지 = 층수"라는 국내 아파트의 흔한
// 번호 규칙으로 층을 추정해서 대신 대조한다 — 정확한 매칭이 아니라 근사치임을 감안해야 한다.
function guessFloorFromUnitNo(unitNo: string): number | null {
  if (unitNo.length < 3) return null;
  const guess = Number(unitNo.slice(0, -2));
  return Number.isFinite(guess) && guess > 0 ? guess : null;
}

export function RealEstateTradeLookup({
  lawdCd,
  dongName,
  complexName,
  unitDong,
  unitHo,
  dealDate,
  onSelectAmount,
}: {
  lawdCd: string;
  dongName: string | null;
  complexName: string | null;
  unitDong: string | null;
  unitHo: string | null;
  dealDate: string;
  onSelectAmount: (amount: number) => void;
}) {
  const searchTrades = useSearchRealEstateTrades();
  const [trades, setTrades] = useState<RealEstateTrade[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTrades(null);
    setError(null);
    searchTrades.mutate(
      { lawdCd, dealYm: dealYmOf(dealDate), complexName: complexName ?? undefined },
      {
        onSuccess: setTrades,
        onError: (err) => setError(getErrorMessage(err, '실거래가 조회에 실패했습니다.')),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lawdCd, dealDate, complexName]);

  if (searchTrades.isPending) {
    return (
      <View className="items-center gap-2 rounded-xl bg-cream p-4 dark:bg-slate-800">
        <ActivityIndicator />
        <Text className="text-xs text-slate-400">{dealDate} 실거래가를 조회하고 있어요...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="rounded-xl bg-cream p-3 dark:bg-slate-800">
        <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
      </View>
    );
  }

  if (!trades) return null;

  // 카카오 주소에서 우리 단지명을 알아냈으면 국토교통부 쪽에서 이미 그 단지 이름으로
  // 필터링해서 내려주므로 그대로 쓰고, 단지명을 못 얻었을 때만(예: 빌라·단독주택) 동 이름으로 대신 좁힌다.
  let scoped = complexName ? trades : dongName ? trades.filter((t) => t.dong === dongName) : trades;

  const hasBuildingDongData = scoped.some((t) => t.buildingDong && t.buildingDong.trim());
  if (unitDong && hasBuildingDongData) {
    scoped = scoped.filter((t) => {
      const raw = t.buildingDong?.replace(/[^0-9]/g, '');
      return !raw || raw === unitDong;
    });
  }

  const floorGuess = unitHo ? guessFloorFromUnitNo(unitHo) : null;
  if (floorGuess != null) {
    scoped = scoped.filter((t) => t.floor == null || t.floor === floorGuess);
  }

  const exactMatches = scoped.filter((t) => t.dealDate === dealDate);
  const otherMatches = scoped.filter((t) => t.dealDate !== dealDate);
  const scopeLabel = complexName ?? dongName ?? '해당 지역';
  const otherScopeLabel = complexName ? '같은 단지의' : '같은 동의';

  if (scoped.length === 0) {
    return (
      <View className="rounded-xl bg-cream p-3 dark:bg-slate-800">
        <Text className="text-sm text-slate-500 dark:text-slate-300">
          {scopeLabel}
          {unitDong ? ` ${unitDong}동` : ''}
          {floorGuess != null ? ` ${floorGuess}층` : ''}의 {dealDate.slice(0, 7)} 실거래가를 찾지 못했어요. 평가금액을
          직접 입력해주세요.
        </Text>
      </View>
    );
  }

  const renderTrade = (trade: RealEstateTrade, index: number) => (
    <Pressable
      key={index}
      onPress={() => onSelectAmount(trade.dealAmount)}
      className="gap-0.5 rounded-lg bg-white p-3 dark:bg-slate-900">
      <View className="flex-row items-center justify-between">
        <Text className="font-medium text-slate-900 dark:text-white">{trade.aptName ?? '이름 없음'}</Text>
        <Text className="font-semibold text-primary">{formatKrw(trade.dealAmount)}</Text>
      </View>
      <Text className="text-xs text-slate-400">
        {trade.buildingDong ? `${trade.buildingDong}동 · ` : ''}
        {trade.exclusiveArea ? `전용 ${trade.exclusiveArea}㎡ · ` : ''}
        {trade.floor != null ? `${trade.floor}층 · ` : ''}
        {trade.dealDate ?? ''}
      </Text>
    </Pressable>
  );

  return (
    <View className="gap-3 rounded-xl bg-cream p-3 dark:bg-slate-800">
      {unitDong || floorGuess != null ? (
        <Text className="text-xs text-slate-400">
          {unitDong ? `${unitDong}동 ` : ''}
          {floorGuess != null ? `${floorGuess}층(호수 기준 추정) ` : ''}
          위주로 좁혀서 보여드려요. 호수는 국토교통부가 공개하지 않아 정확히 일치하지 않을 수 있어요.
        </Text>
      ) : null}
      {exactMatches.length > 0 ? (
        <View className="gap-2">
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-300">
            {dealDate} 거래 ({exactMatches.length}건)
          </Text>
          {exactMatches.map(renderTrade)}
        </View>
      ) : (
        <Text className="text-sm text-slate-500 dark:text-slate-300">
          {dealDate}에 정확히 일치하는 거래는 없어요. {otherScopeLabel} 이번 달 다른 거래를 참고해주세요.
        </Text>
      )}
      {otherMatches.length > 0 ? (
        <View className="gap-2">
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-300">
            {otherScopeLabel} 이번 달 다른 거래 ({otherMatches.length}건)
          </Text>
          {otherMatches.map(renderTrade)}
        </View>
      ) : null}
    </View>
  );
}
