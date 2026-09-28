import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useCategories } from '@/features/category/api';
import { formatKrw } from '@/lib/format';

import { useMonthlyStatistics } from './api';
import type { ParentCategoryFilter } from './MonthSummaryPanel';

/** 예산이 잡혀있는 카테고리는 예산 대비 사용률(과다 지출 시 빨간색)로 보여준다. */
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

/** 대분류별 지출 목록. 예산이 있으면 "사용액 / 최대 예산"과 사용률 막대를, 없으면 "예산 등록
 * 필요"를 보여준다. 달력 탭(모바일)과 통계 사이드 패널(데스크톱)에서 함께 쓴다. */
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
  const { data: categories = [] } = useCategories();

  if (isLoading || !summary) {
    return (
      <View className={card ? 'items-center rounded-xl bg-white p-4' : 'items-center py-2'}>
        <ActivityIndicator />
      </View>
    );
  }

  const parentExpenses = summary.byParentCategory.filter((c) => c.type === 'EXPENSE');
  // 대분류 예산 = 하위 소분류 예산의 합(통계 탭과 동일). 하위가 없으면 자기 예산. 0원이면 없음.
  const budgetFor = (categoryId: number): number | null => {
    const children = categories.filter((c) => c.parentId === categoryId);
    const items = children.length > 0 ? children : categories.filter((c) => c.id === categoryId);
    const sum = items.reduce((total, c) => total + (c.targetAmount ?? 0), 0);
    return sum > 0 ? sum : null;
  };

  return (
    <View className={card ? 'gap-2 rounded-xl bg-white p-4 shadow-sm shadow-slate-200' : 'gap-2'}>
      <Text className="text-sm font-semibold text-slate-500">{title}</Text>
      {parentExpenses.length === 0 ? (
        <Text className="text-xs text-slate-400">내역이 없어요.</Text>
      ) : (
        parentExpenses.map((item) => {
          const budget = budgetFor(item.categoryId);
          const over = budget != null && item.amount > budget;
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
                  {budget != null ? `${formatKrw(item.amount)} / ${formatKrw(budget)}` : formatKrw(item.amount)}
                </Text>
              </View>
              {budget != null ? (
                <BudgetBar spent={item.amount} target={budget} />
              ) : (
                <Text className="text-[10px] text-slate-400">예산 등록 필요</Text>
              )}
            </Pressable>
          );
        })
      )}
    </View>
  );
}
