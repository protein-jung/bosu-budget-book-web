import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { formatKrw } from '@/lib/format';

import { useMonthlyStatistics } from './api';
import type { ParentCategoryFilter } from './MonthSummaryPanel';

function Bar({ amount, max, color }: { amount: number; max: number; color: string }) {
  return (
    <View className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <View className="h-full rounded-full" style={{ width: `${(amount / max) * 100}%`, backgroundColor: color }} />
    </View>
  );
}

/** 예산이 잡혀있는 카테고리는 크기 비교용 막대 대신 예산 대비 사용률(과다 지출 시 빨간색)로 보여준다. */
export function BudgetBar({ spent, target }: { spent: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (spent / target) * 100) : 0;
  const over = spent > target;
  const color = over ? '#e03131' : pct >= 80 ? '#f08c00' : '#2f9e44';
  return (
    <View className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <View className="h-full rounded-full" style={{ width: `${Math.max(pct, spent > 0 ? 3 : 0)}%`, backgroundColor: color }} />
    </View>
  );
}

/** 대분류별 지출 목록. 예산이 있으면 "사용액 / 최대 예산"과 사용률 막대를, 없으면 지출 비교용
 * 막대만 보여준다. 달력 탭(모바일)과 통계 사이드 패널(데스크톱)에서 함께 쓴다. */
export function CategoryBudgetSummary({
  year,
  month,
  selectedParentCategoryId,
  onSelectParentCategory,
  title = '대분류별 사용액 / 예산',
  card = true,
}: {
  year: number;
  month: number;
  selectedParentCategoryId?: number | null;
  onSelectParentCategory?: (group: ParentCategoryFilter) => void;
  title?: string;
  /** true면 흰 배경 카드로 감싼다(달력 탭 등 독립 배치용). 다른 요약과 한 카드에 이미
   * 들어있는 통계 사이드 패널에서는 false로 넘겨 이중 카드가 되지 않게 한다. */
  card?: boolean;
}) {
  const { data: summary, isLoading } = useMonthlyStatistics(year, month);

  if (isLoading || !summary) {
    return (
      <View className={card ? 'items-center rounded-xl bg-white p-4' : 'items-center py-2'}>
        <ActivityIndicator />
      </View>
    );
  }

  const parentExpenses = summary.byParentCategory.filter((c) => c.type === 'EXPENSE');
  const maxCategory = Math.max(1, ...parentExpenses.map((c) => c.amount));
  const budgetByCategoryId = new Map(summary.budgets.map((b) => [b.categoryId, b]));

  return (
    <View className={card ? 'gap-2 rounded-xl bg-white p-4 shadow-sm shadow-slate-200' : 'gap-2'}>
      <Text className="text-sm font-semibold text-slate-500">{title}</Text>
      {parentExpenses.length === 0 ? (
        <Text className="text-xs text-slate-400">내역이 없어요.</Text>
      ) : (
        parentExpenses.map((item) => {
          const budget = budgetByCategoryId.get(item.categoryId);
          const over = !!budget && item.amount > budget.targetAmount;
          return (
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
                <Text className={`text-xs font-medium ${over ? 'text-red-500' : 'text-slate-900'}`}>
                  {budget ? `${formatKrw(item.amount)} / ${formatKrw(budget.targetAmount)}` : formatKrw(item.amount)}
                </Text>
              </View>
              {budget ? (
                <BudgetBar spent={item.amount} target={budget.targetAmount} />
              ) : (
                <Bar amount={item.amount} max={maxCategory} color={item.color ?? '#02007D'} />
              )}
            </Pressable>
          );
        })
      )}
    </View>
  );
}
