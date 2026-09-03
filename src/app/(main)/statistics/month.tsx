import { Link, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { BarChart } from '@/components/charts/BarChart';
import { DonutChart, type DonutDatum } from '@/components/charts/DonutChart';
import { GroupedBarChart } from '@/components/charts/GroupedBarChart';
import { Screen } from '@/components/Screen';
import { useCategories } from '@/features/category/api';
import { BudgetTargetModal } from '@/features/statistics/BudgetTargetModal';
import { useMonthlyStatistics, useRangeStatistics } from '@/features/statistics/api';
import { type MemoTarget } from '@/features/statistics/CategoryMemoModal';
import { CategorySpendingDetailModal } from '@/features/statistics/CategorySpendingDetailModal';
import { addMonths, formatMonthLabel } from '@/lib/calendar';
import { formatCompactKrw, formatKrw } from '@/lib/format';
import type { Category, CategoryBudget, CategoryStat } from '@/lib/types';

const OTHER_COLOR = '#94a3b8';
const CARD_COLOR = '#E07A5F';
const INCOME_COLOR = '#2f9e44';
const EXPENSE_COLOR = '#e03131';
const DONUT_SLICE_LIMIT = 6;
const TREND_MONTHS = 6;

type LegendDatum = DonutDatum & { label: string; amount: number; categoryId: number };

function buildLegend(categories: CategoryStat[]): LegendDatum[] {
  const sorted = [...categories].sort((a, b) => b.amount - a.amount);
  if (sorted.length <= DONUT_SLICE_LIMIT + 1) {
    return sorted.map((c) => ({
      key: String(c.categoryId),
      categoryId: c.categoryId,
      label: c.categoryName,
      amount: c.amount,
      value: c.amount,
      color: c.color ?? '#02007D',
    }));
  }
  const top = sorted.slice(0, DONUT_SLICE_LIMIT);
  const restAmount = sorted.slice(DONUT_SLICE_LIMIT).reduce((sum, c) => sum + c.amount, 0);
  return [
    ...top.map((c) => ({
      key: String(c.categoryId),
      categoryId: c.categoryId,
      label: c.categoryName,
      amount: c.amount,
      value: c.amount,
      color: c.color ?? '#02007D',
    })),
    { key: 'other', categoryId: -1, label: '기타', amount: restAmount, value: restAmount, color: OTHER_COLOR },
  ];
}

type BudgetGroup = {
  key: string;
  parentCategory: Category | null;
  parent: CategoryBudget | null;
  children: CategoryBudget[];
};

/** 예산 목록을 상위 카테고리 기준으로 묶는다. 상위 카테고리 자체엔 예산이 없어도 하위에 있으면 묶음만 만든다. */
function groupBudgets(budgets: CategoryBudget[], categories: Category[]): BudgetGroup[] {
  if (budgets.length === 0) return [];
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const budgetByCategoryId = new Map(budgets.map((b) => [b.categoryId, b]));
  const childrenByParent = new Map<number, CategoryBudget[]>();
  for (const b of budgets) {
    const parentId = categoryById.get(b.categoryId)?.parentId;
    if (parentId == null) continue;
    const list = childrenByParent.get(parentId) ?? [];
    list.push(b);
    childrenByParent.set(parentId, list);
  }

  const groups: BudgetGroup[] = [];
  const handled = new Set<number>();
  for (const category of categories.filter((c) => c.parentId == null)) {
    const ownBudget = budgetByCategoryId.get(category.id) ?? null;
    const children = childrenByParent.get(category.id) ?? [];
    if (!ownBudget && children.length === 0) continue;
    handled.add(category.id);
    groups.push({ key: String(category.id), parentCategory: category, parent: ownBudget, children });
  }

  // 상위 카테고리를 categories 목록에서 못 찾은 예산(이론상 거의 없음)은 단독 항목으로 남긴다.
  for (const b of budgets) {
    const category = categoryById.get(b.categoryId);
    if (category?.parentId == null && !handled.has(b.categoryId)) {
      groups.push({ key: `standalone-${b.categoryId}`, parentCategory: category ?? null, parent: b, children: [] });
    }
  }

  return groups;
}

export default function StatisticsMonthScreen() {
  const params = useLocalSearchParams<{ year?: string; month?: string }>();
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(() => (params.year ? Number(params.year) : today.getFullYear()));
  const [month, setMonth] = useState(() => (params.month ? Number(params.month) : today.getMonth() + 1));
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [editingBudgetCategory, setEditingBudgetCategory] = useState<Category | null>(null);
  const [viewingSpending, setViewingSpending] = useState<MemoTarget | null>(null);

  const { data: categories = [] } = useCategories();
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const { data: summary, isLoading } = useMonthlyStatistics(year, month);
  const { data: range, isLoading: rangeLoading } = useRangeStatistics(year, month, TREND_MONTHS);

  const budgetGroups = useMemo(
    () => groupBudgets(summary?.budgets ?? [], categories),
    [summary, categories],
  );

  const renderBudgetRow = (b: CategoryBudget) => {
    const pct = b.targetAmount > 0 ? Math.min(100, Math.round((b.spentAmount / b.targetAmount) * 100)) : 0;
    const over = b.spentAmount > b.targetAmount;
    const barColor = over ? '#e03131' : pct >= 80 ? '#f08c00' : '#2f9e44';
    return (
      <Pressable
        key={b.categoryId}
        onPress={() => setEditingBudgetCategory(categoryById.get(b.categoryId) ?? null)}
        className="gap-1.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 text-sm text-slate-700 dark:text-slate-200" numberOfLines={1}>
            {b.icon ? `${b.icon} ` : ''}
            {b.categoryName}
          </Text>
          <Text className={`text-sm font-medium ${over ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
            {formatKrw(b.spentAmount)} / {formatKrw(b.targetAmount)}
          </Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <View
            className="h-full rounded-full"
            style={{ width: `${Math.max(pct, b.spentAmount > 0 ? 3 : 0)}%`, backgroundColor: barColor }}
          />
        </View>
      </Pressable>
    );
  };

  const changeMonth = (delta: number) => {
    const next = addMonths(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
    setSelectedParentId(null);
  };

  const expenseParents = useMemo(
    () => summary?.byParentCategory.filter((c) => c.type === 'EXPENSE') ?? [],
    [summary],
  );
  const expenseLeaves = useMemo(
    () => summary?.byCategory.filter((c) => c.type === 'EXPENSE') ?? [],
    [summary],
  );
  const incomeParents = useMemo(
    () => summary?.byParentCategory.filter((c) => c.type === 'INCOME') ?? [],
    [summary],
  );

  const selectedParent = useMemo(
    () => expenseParents.find((c) => c.categoryId === selectedParentId) ?? null,
    [expenseParents, selectedParentId],
  );

  const drillLeaves = useMemo(() => {
    if (selectedParentId == null) return [];
    return expenseLeaves.filter((c) => c.parentId === selectedParentId);
  }, [expenseLeaves, selectedParentId]);

  const donutSource = selectedParentId == null ? expenseParents : drillLeaves;
  const categoryLegend = useMemo(() => buildLegend(donutSource), [donutSource]);
  const expenseTotal = useMemo(
    () => donutSource.reduce((sum, c) => sum + c.amount, 0),
    [donutSource],
  );

  const cardData = useMemo(
    () =>
      (summary?.byCard ?? []).map((c) => ({
        key: String(c.cardId),
        label: c.cardName,
        value: c.amount,
        color: CARD_COLOR,
      })),
    [summary],
  );

  const memberMax = useMemo(
    () => Math.max(1, ...(summary?.byMember ?? []).flatMap((m) => [m.income, m.expense])),
    [summary],
  );

  const trendGroups = useMemo(
    () =>
      (range?.months ?? []).map((point) => ({
        key: `${point.year}-${point.month}`,
        label: `${point.month}월`,
        values: {
          income: point.totalIncome,
          expense: point.totalExpense,
        },
      })),
    [range],
  );

  const parentTrendSeries = useMemo(() => {
    const names = new Map<number, { name: string; color: string }>();
    for (const point of range?.months ?? []) {
      for (const cat of point.byParentCategory.filter((c) => c.type === 'EXPENSE')) {
        if (!names.has(cat.categoryId)) {
          names.set(cat.categoryId, { name: cat.categoryName, color: cat.color ?? '#02007D' });
        }
      }
    }
    // 최근 월 기준 상위 4개 대분류만 표시
    const latest = range?.months[range.months.length - 1];
    const topIds = [...(latest?.byParentCategory.filter((c) => c.type === 'EXPENSE') ?? [])]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4)
      .map((c) => c.categoryId);
    return topIds
      .filter((id) => names.has(id))
      .map((id) => ({
        key: String(id),
        label: names.get(id)!.name,
        color: names.get(id)!.color,
      }));
  }, [range]);

  const parentTrendGroups = useMemo(
    () =>
      (range?.months ?? []).map((point) => {
        const values: Record<string, number> = {};
        for (const s of parentTrendSeries) {
          const found = point.byParentCategory.find(
            (c) => c.type === 'EXPENSE' && String(c.categoryId) === s.key,
          );
          values[s.key] = found?.amount ?? 0;
        }
        return {
          key: `${point.year}-${point.month}`,
          label: `${point.month}월`,
          values,
        };
      }),
    [range, parentTrendSeries],
  );

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

      <Link href="/statistics" className="self-start text-sm font-medium text-primary dark:text-secondary">
        ‹ 월별 표로
      </Link>

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

          <View className="gap-1 rounded-xl bg-white p-4 dark:bg-slate-900">
            <Text className="text-sm text-slate-500 dark:text-slate-400">수입 − 지출</Text>
            <Text
              className={`text-lg font-bold ${summary.netAmount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {formatKrw(summary.netAmount)}
            </Text>
          </View>

          {summary.budgets.length > 0 ? (
            <View className="gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
              <Text className="text-base font-semibold text-slate-900 dark:text-white">예산</Text>
              {budgetGroups.map((group) => (
                <View key={group.key} className="gap-1.5">
                  {group.parent ? (
                    renderBudgetRow(group.parent)
                  ) : (
                    <Text className="text-sm font-medium text-slate-500 dark:text-slate-400" numberOfLines={1}>
                      {group.parentCategory?.icon ? `${group.parentCategory.icon} ` : ''}
                      {group.parentCategory?.name ?? ''}
                    </Text>
                  )}
                  {group.children.length > 0 ? (
                    <View className="ml-4 gap-1.5 border-l border-slate-100 pl-3 dark:border-slate-800">
                      {group.children.map(renderBudgetRow)}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          <View className="gap-4 rounded-xl bg-white p-4 dark:bg-slate-900">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-slate-900 dark:text-white">
                {selectedParent ? `${selectedParent.categoryName} 세부` : '대분류별 지출'}
              </Text>
              {selectedParent ? (
                <Pressable onPress={() => setSelectedParentId(null)} className="px-2 py-1">
                  <Text className="text-sm font-medium text-primary">← 전체</Text>
                </Pressable>
              ) : null}
            </View>

            {donutSource.length === 0 ? (
              <Text className="text-sm text-slate-400">이번 달 지출 내역이 없어요.</Text>
            ) : (
              <>
                <View className="items-center">
                  <DonutChart data={categoryLegend}>
                    <Text className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedParent ? selectedParent.categoryName : '총지출'}
                    </Text>
                    <Text className="text-xl font-bold text-slate-900 dark:text-white">
                      {formatCompactKrw(expenseTotal)}원
                    </Text>
                  </DonutChart>
                </View>
                <View className="gap-2.5">
                  {categoryLegend.map((item) => {
                    const canDrill =
                      selectedParentId == null &&
                      item.categoryId > 0 &&
                      expenseLeaves.some((c) => c.parentId === item.categoryId);
                    return (
                      <Pressable
                        key={item.key}
                        disabled={item.categoryId <= 0}
                        onPress={() =>
                          canDrill
                            ? setSelectedParentId(item.categoryId)
                            : setViewingSpending({
                                categoryId: item.categoryId,
                                categoryName: item.label,
                                icon: categoryById.get(item.categoryId)?.icon ?? null,
                                year,
                                month,
                                memo: null,
                              })
                        }
                        className="flex-row items-center gap-2.5">
                        <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <Text className="flex-1 text-sm text-slate-700 dark:text-slate-200" numberOfLines={1}>
                          {item.label}
                          {canDrill ? ' ›' : ''}
                        </Text>
                        <Text className="text-sm text-slate-400">
                          {expenseTotal > 0 ? Math.round((item.amount / expenseTotal) * 100) : 0}%
                        </Text>
                        <Text className="w-24 text-right text-sm font-medium text-slate-900 dark:text-white">
                          {formatKrw(item.amount)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {incomeParents.length > 0 ? (
              <View className="gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">수입 카테고리</Text>
                {incomeParents.map((item) => (
                  <Pressable
                    key={item.categoryId}
                    onPress={() =>
                      setViewingSpending({
                        categoryId: item.categoryId,
                        categoryName: item.categoryName,
                        icon: categoryById.get(item.categoryId)?.icon ?? null,
                        year,
                        month,
                        memo: null,
                      })
                    }
                    className="flex-row items-center gap-2.5">
                    <View
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color ?? '#02007D' }}
                    />
                    <Text className="flex-1 text-sm text-slate-700 dark:text-slate-200" numberOfLines={1}>
                      {item.categoryName}
                    </Text>
                    <Text className="text-sm font-medium text-slate-900 dark:text-white">
                      {formatKrw(item.amount)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View className="gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">
              최근 {TREND_MONTHS}개월 수입·지출
            </Text>
            {rangeLoading || !range ? (
              <ActivityIndicator />
            ) : (
              <GroupedBarChart
                groups={trendGroups}
                series={[
                  { key: 'income', label: '수입', color: INCOME_COLOR },
                  { key: 'expense', label: '지출', color: EXPENSE_COLOR },
                ]}
                formatValue={formatCompactKrw}
              />
            )}
          </View>

          <View className="gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">대분류 월별 추이</Text>
            {rangeLoading || !range ? (
              <ActivityIndicator />
            ) : parentTrendSeries.length === 0 ? (
              <Text className="text-sm text-slate-400">표시할 대분류 지출이 없어요.</Text>
            ) : (
              <GroupedBarChart
                groups={parentTrendGroups}
                series={parentTrendSeries}
                formatValue={formatCompactKrw}
              />
            )}
          </View>

          <View className="gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">카드별</Text>
            {cardData.length === 0 ? (
              <Text className="text-sm text-slate-400">카드 사용 내역이 없어요.</Text>
            ) : (
              <BarChart data={cardData} formatValue={formatKrw} />
            )}
          </View>

          <View className="gap-3">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">멤버별</Text>
            {summary.byMember.length === 0 ? (
              <Text className="text-sm text-slate-400">내역이 없어요.</Text>
            ) : (
              summary.byMember.map((item) => (
                <View key={item.userId} className="gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
                  <Text className="font-medium text-slate-900 dark:text-white">{item.userName}</Text>
                  <BarChart
                    maxValue={memberMax}
                    formatValue={formatKrw}
                    data={[
                      { key: 'income', label: '수입', value: item.income, color: INCOME_COLOR },
                      { key: 'expense', label: '지출', value: item.expense, color: EXPENSE_COLOR },
                    ]}
                  />
                </View>
              ))
            )}
          </View>
        </>
      )}

      <BudgetTargetModal
        visible={editingBudgetCategory !== null}
        onClose={() => setEditingBudgetCategory(null)}
        category={editingBudgetCategory}
      />

      <CategorySpendingDetailModal
        visible={viewingSpending !== null}
        target={viewingSpending}
        onClose={() => setViewingSpending(null)}
      />
    </Screen>
  );
}
