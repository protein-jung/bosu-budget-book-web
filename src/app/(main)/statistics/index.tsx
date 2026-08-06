import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useMonthlyStatistics } from '@/features/statistics/api';
import { addMonths, formatMonthLabel } from '@/lib/calendar';
import { formatKrw } from '@/lib/format';

export default function StatisticsScreen() {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const { data: summary, isLoading } = useMonthlyStatistics(year, month);

  const changeMonth = (delta: number) => {
    const next = addMonths(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  const maxCategoryAmount = summary ? Math.max(1, ...summary.byCategory.map((c) => c.amount)) : 1;
  const maxCardAmount = summary ? Math.max(1, ...summary.byCard.map((c) => c.amount)) : 1;

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => changeMonth(-1)} className="px-3 py-2">
          <Text className="text-xl text-slate-600 dark:text-slate-300">‹</Text>
        </Pressable>
        <Text className="text-lg font-bold text-slate-900 dark:text-white">{formatMonthLabel(year, month)}</Text>
        <Pressable onPress={() => changeMonth(1)} className="px-3 py-2">
          <Text className="text-xl text-slate-600 dark:text-slate-300">›</Text>
        </Pressable>
      </View>

      {isLoading || !summary ? (
        <ActivityIndicator />
      ) : (
        <>
          <View className="flex-row gap-3">
            <View className="flex-1 gap-1 rounded-xl bg-white p-4 dark:bg-slate-900">
              <Text className="text-sm text-slate-500 dark:text-slate-400">수입</Text>
              <Text className="text-lg font-bold text-emerald-600">{formatKrw(summary.totalIncome)}</Text>
            </View>
            <View className="flex-1 gap-1 rounded-xl bg-white p-4 dark:bg-slate-900">
              <Text className="text-sm text-slate-500 dark:text-slate-400">지출</Text>
              <Text className="text-lg font-bold text-red-500">{formatKrw(summary.totalExpense)}</Text>
            </View>
          </View>

          <View className="gap-3">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">카테고리별</Text>
            {summary.byCategory.length === 0 ? (
              <Text className="text-sm text-slate-400">이번 달 내역이 없어요.</Text>
            ) : (
              summary.byCategory.map((item) => (
                <View key={item.categoryId} className="gap-1.5">
                  <View className="flex-row justify-between">
                    <Text className="text-slate-700 dark:text-slate-200">{item.categoryName}</Text>
                    <Text className="font-medium text-slate-900 dark:text-white">{formatKrw(item.amount)}</Text>
                  </View>
                  <View className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${(item.amount / maxCategoryAmount) * 100}%`,
                        backgroundColor: item.color ?? '#2563eb',
                      }}
                    />
                  </View>
                </View>
              ))
            )}
          </View>

          <View className="gap-3">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">카드별</Text>
            {summary.byCard.length === 0 ? (
              <Text className="text-sm text-slate-400">카드 사용 내역이 없어요.</Text>
            ) : (
              summary.byCard.map((item) => (
                <View key={item.cardId} className="gap-1.5">
                  <View className="flex-row justify-between">
                    <Text className="text-slate-700 dark:text-slate-200">{item.cardName}</Text>
                    <Text className="font-medium text-slate-900 dark:text-white">{formatKrw(item.amount)}</Text>
                  </View>
                  <View className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <View
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${(item.amount / maxCardAmount) * 100}%` }}
                    />
                  </View>
                </View>
              ))
            )}
          </View>

          <View className="gap-3">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">멤버별</Text>
            {summary.byMember.length === 0 ? (
              <Text className="text-sm text-slate-400">내역이 없어요.</Text>
            ) : (
              summary.byMember.map((item) => (
                <View key={item.userId} className="flex-row items-center justify-between rounded-xl bg-white p-4 dark:bg-slate-900">
                  <Text className="font-medium text-slate-900 dark:text-white">{item.userName}</Text>
                  <View className="items-end gap-0.5">
                    <Text className="text-sm text-emerald-600">+{formatKrw(item.income)}</Text>
                    <Text className="text-sm text-red-500">-{formatKrw(item.expense)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </Screen>
  );
}
