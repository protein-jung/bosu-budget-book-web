import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { formatKrw } from '@/lib/format';
import type { TransactionType } from '@/lib/types';

import { useMonthlyStatistics } from './api';

function Bar({ amount, max, color }: { amount: number; max: number; color: string }) {
  return (
    <View className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <View className="h-full rounded-full" style={{ width: `${(amount / max) * 100}%`, backgroundColor: color }} />
    </View>
  );
}

export type ParentCategoryFilter = { id: number; name: string; icon: string | null };

export function MonthSummaryPanel({
  year,
  month,
  selectedType,
  onSelectType,
  selectedParentCategoryId,
  onSelectParentCategory,
  selectedMemberUserId,
  onSelectMember,
  selectedCardId,
  onSelectCard,
}: {
  year: number;
  month: number;
  selectedType?: TransactionType | null;
  onSelectType?: (type: TransactionType) => void;
  selectedParentCategoryId?: number | null;
  onSelectParentCategory?: (group: ParentCategoryFilter) => void;
  selectedMemberUserId?: number | null;
  onSelectMember?: (userId: number) => void;
  selectedCardId?: number | null;
  onSelectCard?: (cardId: number) => void;
}) {
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
          <Pressable
            onPress={() => onSelectType?.('INCOME')}
            className={`flex-1 gap-0.5 rounded-xl p-3 ${
              selectedType === 'INCOME' ? 'bg-emerald-100' : 'bg-cream'
            }`}>
            <Text className="text-xs text-slate-500">수입</Text>
            <Text className="text-base font-bold text-emerald-600">{formatKrw(summary.totalIncome)}</Text>
          </Pressable>
          <Pressable
            onPress={() => onSelectType?.('EXPENSE')}
            className={`flex-1 gap-0.5 rounded-xl p-3 ${
              selectedType === 'EXPENSE' ? 'bg-red-100' : 'bg-cream'
            }`}>
            <Text className="text-xs text-slate-500">지출</Text>
            <Text className="text-base font-bold text-red-500">{formatKrw(summary.totalExpense)}</Text>
          </Pressable>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-slate-500">대분류별</Text>
        {parentExpenses.length === 0 ? (
          <Text className="text-xs text-slate-400">내역이 없어요.</Text>
        ) : (
          parentExpenses.slice(0, 6).map((item) => (
            <Pressable
              key={item.categoryId}
              onPress={() =>
                onSelectParentCategory?.({ id: item.categoryId, name: item.categoryName, icon: item.icon })
              }
              className={`gap-1 rounded-lg p-1.5 ${
                selectedParentCategoryId === item.categoryId ? 'bg-primary-light' : ''
              }`}>
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-700" numberOfLines={1}>
                  {item.icon ? `${item.icon} ` : ''}
                  {item.categoryName}
                </Text>
                <Text className="text-xs font-medium text-slate-900">{formatKrw(item.amount)}</Text>
              </View>
              <Bar amount={item.amount} max={maxCategory} color={item.color ?? '#1F6F5C'} />
            </Pressable>
          ))
        )}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-slate-500">사람별</Text>
        {summary.byMember.length === 0 ? (
          <Text className="text-xs text-slate-400">내역이 없어요.</Text>
        ) : (
          summary.byMember.map((item) => (
            <Pressable
              key={item.userId}
              onPress={() => onSelectMember?.(item.userId)}
              className={`flex-row items-center justify-between rounded-xl px-3 py-2 ${
                selectedMemberUserId === item.userId ? 'bg-primary-light' : 'bg-cream'
              }`}>
              <Text className="text-xs font-medium text-slate-900">{item.userName}</Text>
              <View className="items-end">
                <Text className="text-xs text-emerald-600">+{formatKrw(item.income)}</Text>
                <Text className="text-xs text-red-500">-{formatKrw(item.expense)}</Text>
              </View>
            </Pressable>
          ))
        )}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-slate-500">카드별</Text>
        {summary.byCard.length === 0 ? (
          <Text className="text-xs text-slate-400">내역이 없어요.</Text>
        ) : (
          summary.byCard.slice(0, 6).map((item) => (
            <Pressable
              key={item.cardId}
              onPress={() => onSelectCard?.(item.cardId)}
              className={`gap-1 rounded-lg p-1.5 ${selectedCardId === item.cardId ? 'bg-primary-light' : ''}`}>
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-700" numberOfLines={1}>
                  {item.cardName}
                </Text>
                <Text className="text-xs font-medium text-slate-900">{formatKrw(item.amount)}</Text>
              </View>
              <Bar amount={item.amount} max={maxCard} color="#E07A5F" />
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}
