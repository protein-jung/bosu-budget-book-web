import { ActivityIndicator, Text, View } from 'react-native';

import { formatKrw } from '@/lib/format';

import { useMonthlyStatistics } from './api';

function Bar({ amount, max, color }: { amount: number; max: number; color: string }) {
  return (
    <View className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <View className="h-full rounded-full" style={{ width: `${(amount / max) * 100}%`, backgroundColor: color }} />
    </View>
  );
}

export function MonthSummaryPanel({ year, month }: { year: number; month: number }) {
  const { data: summary, isLoading } = useMonthlyStatistics(year, month);

  if (isLoading || !summary) {
    return (
      <View className="w-[320px] items-center rounded-2xl bg-white p-6">
        <ActivityIndicator />
      </View>
    );
  }

  const parentExpenses = summary.byParentCategory.filter((c) => c.type === 'EXPENSE');
  const maxCategory = Math.max(1, ...parentExpenses.map((c) => c.amount));
  const maxCard = Math.max(1, ...summary.byCard.map((c) => c.amount));

  return (
    <View className="w-[320px] gap-5 rounded-2xl bg-white p-5">
      <View className="gap-2">
        <Text className="text-sm font-semibold text-slate-500">전체</Text>
        <View className="flex-row gap-2">
          <View className="flex-1 gap-0.5 rounded-xl bg-cream p-3">
            <Text className="text-xs text-slate-500">수입</Text>
            <Text className="text-base font-bold text-emerald-600">{formatKrw(summary.totalIncome)}</Text>
          </View>
          <View className="flex-1 gap-0.5 rounded-xl bg-cream p-3">
            <Text className="text-xs text-slate-500">지출</Text>
            <Text className="text-base font-bold text-red-500">{formatKrw(summary.totalExpense)}</Text>
          </View>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-slate-500">대분류별</Text>
        {parentExpenses.length === 0 ? (
          <Text className="text-xs text-slate-400">내역이 없어요.</Text>
        ) : (
          parentExpenses.slice(0, 6).map((item) => (
            <View key={item.categoryId} className="gap-1">
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-700" numberOfLines={1}>
                  {item.icon ? `${item.icon} ` : ''}
                  {item.categoryName}
                </Text>
                <Text className="text-xs font-medium text-slate-900">{formatKrw(item.amount)}</Text>
              </View>
              <Bar amount={item.amount} max={maxCategory} color={item.color ?? '#1F6F5C'} />
            </View>
          ))
        )}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-slate-500">사람별</Text>
        {summary.byMember.length === 0 ? (
          <Text className="text-xs text-slate-400">내역이 없어요.</Text>
        ) : (
          summary.byMember.map((item) => (
            <View key={item.userId} className="flex-row items-center justify-between rounded-xl bg-cream px-3 py-2">
              <Text className="text-xs font-medium text-slate-900">{item.userName}</Text>
              <View className="items-end">
                <Text className="text-xs text-emerald-600">+{formatKrw(item.income)}</Text>
                <Text className="text-xs text-red-500">-{formatKrw(item.expense)}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-slate-500">카드별</Text>
        {summary.byCard.length === 0 ? (
          <Text className="text-xs text-slate-400">내역이 없어요.</Text>
        ) : (
          summary.byCard.slice(0, 6).map((item) => (
            <View key={item.cardId} className="gap-1">
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-700" numberOfLines={1}>
                  {item.cardName}
                </Text>
                <Text className="text-xs font-medium text-slate-900">{formatKrw(item.amount)}</Text>
              </View>
              <Bar amount={item.amount} max={maxCard} color="#E07A5F" />
            </View>
          ))
        )}
      </View>
    </View>
  );
}
