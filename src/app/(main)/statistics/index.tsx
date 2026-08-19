import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useCategories, useCategoryMemos } from '@/features/category/api';
import { CategoryFormModal } from '@/features/category/CategoryFormModal';
import { useFullHistoryStatistics } from '@/features/statistics/api';
import { CategoryMemoModal, type MemoTarget } from '@/features/statistics/CategoryMemoModal';
import { CategorySpendingDetailModal } from '@/features/statistics/CategorySpendingDetailModal';
import { formatKrw } from '@/lib/format';
import type { Category, MonthlyTrendPoint, TransactionType } from '@/lib/types';

const LABEL_WIDTH = 132;
const COL_WIDTH = 96;
const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 34;

type Row = {
  key: string;
  label: string;
  icon: string | null;
  categoryId: number | null;
  kind: 'section' | 'group' | 'leaf';
  indent: boolean;
  /** 이 행이 어느 대분류(그룹)의 하위 행인지. 그 대분류가 접혀 있으면 이 행은 숨긴다. */
  parentCategoryId: number | null;
  /** kind가 'section'일 때만 사용. 수입/지출 중 어느 섹션인지 — 해당 월 합계 표시에 쓴다. */
  totalType?: TransactionType;
};

function sortBySortOrder(items: Category[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

function buildTypeRows(categories: Category[], type: TransactionType): Row[] {
  const typeCategories = categories.filter((c) => c.type === type);
  const roots = sortBySortOrder(typeCategories.filter((c) => c.parentId == null));
  const rows: Row[] = [];
  for (const root of roots) {
    const children = sortBySortOrder(typeCategories.filter((c) => c.parentId === root.id));
    if (children.length === 0 && !root.isGroup) {
      rows.push({
        key: `c${root.id}`,
        label: root.name,
        icon: root.icon,
        categoryId: root.id,
        kind: 'leaf',
        indent: false,
        parentCategoryId: null,
      });
    } else {
      rows.push({
        key: `g${root.id}`,
        label: root.name,
        icon: root.icon,
        categoryId: root.id,
        kind: 'group',
        indent: false,
        parentCategoryId: null,
      });
      for (const child of children) {
        rows.push({
          key: `c${child.id}`,
          label: child.name,
          icon: child.icon,
          categoryId: child.id,
          kind: 'leaf',
          indent: true,
          parentCategoryId: root.id,
        });
      }
    }
  }
  return rows;
}

function buildRows(categories: Category[]): Row[] {
  return [
    { key: 'section-income', label: '수입', icon: null, categoryId: null, kind: 'section', indent: false, parentCategoryId: null, totalType: 'INCOME' },
    ...buildTypeRows(categories, 'INCOME'),
    { key: 'section-expense', label: '지출', icon: null, categoryId: null, kind: 'section', indent: false, parentCategoryId: null, totalType: 'EXPENSE' },
    ...buildTypeRows(categories, 'EXPENSE'),
  ];
}

function amountFor(point: MonthlyTrendPoint, row: Row): number {
  if (row.kind === 'section') {
    return row.totalType === 'INCOME' ? point.totalIncome : point.totalExpense;
  }
  if (row.categoryId == null) return 0;
  const list = row.kind === 'group' ? point.byParentCategory : point.byCategory;
  return list.find((c) => c.categoryId === row.categoryId)?.amount ?? 0;
}

function monthLabel(point: MonthlyTrendPoint) {
  return `${point.year}.${String(point.month).padStart(2, '0')}`;
}

function memoKeyFor(categoryId: number, year: number, month: number) {
  return `${categoryId}:${year}:${month}`;
}

export default function StatisticsScreen() {
  const { data: categories = [] } = useCategories();
  const { data: range, isLoading } = useFullHistoryStatistics();
  const { data: memos = [] } = useCategoryMemos();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingMemo, setEditingMemo] = useState<MemoTarget | null>(null);
  const [viewingSpending, setViewingSpending] = useState<MemoTarget | null>(null);
  const [hoveredMemoKey, setHoveredMemoKey] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());

  const toggleGroup = (categoryId: number) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const memoMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of memos) {
      map.set(memoKeyFor(m.categoryId, m.year, m.month), m.memo);
    }
    return map;
  }, [memos]);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const rows = useMemo(() => buildRows(categories), [categories]);
  const visibleRows = useMemo(
    () => rows.filter((row) => row.parentCategoryId == null || !collapsedGroups.has(row.parentCategoryId)),
    [rows, collapsedGroups],
  );
  const months = useMemo(() => [...(range?.months ?? [])].reverse(), [range]);

  return (
    <Screen maxWidthClassName="max-w-[1200px]">
      <Text className="text-xs text-slate-400">처음 거래를 기록한 달부터 이번 달까지예요. 월을 누르면 자세히 볼 수 있어요.</Text>

      {isLoading ? (
        <ActivityIndicator />
      ) : months.length === 0 ? (
        <Text className="py-8 text-center text-slate-400">아직 등록된 거래가 없어요.</Text>
      ) : (
        <View className="flex-row overflow-hidden rounded-xl bg-white dark:bg-slate-900">
          <View style={{ width: LABEL_WIDTH }} className="border-r border-slate-200 dark:border-slate-700">
            <View
              style={{ height: HEADER_HEIGHT }}
              className="justify-center border-b border-slate-200 bg-slate-50 px-2 dark:border-slate-700 dark:bg-slate-800">
              <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">카테고리</Text>
            </View>
            {visibleRows.map((row) => {
              const isCollapsed = row.kind === 'group' && row.categoryId != null && collapsedGroups.has(row.categoryId);
              const content = (
                <Text
                  numberOfLines={1}
                  className={
                    row.kind === 'section'
                      ? 'text-xs font-bold text-slate-500 dark:text-slate-400'
                      : row.kind === 'group'
                        ? 'text-xs font-bold text-slate-900 dark:text-white'
                        : 'text-xs text-slate-600 dark:text-slate-300'
                  }>
                  {row.kind === 'group' ? (isCollapsed ? '▸ ' : '▾ ') : ''}
                  {row.icon ? `${row.icon} ` : ''}
                  {row.label}
                </Text>
              );
              if (row.kind === 'section') {
                return (
                  <View
                    key={row.key}
                    style={{ height: ROW_HEIGHT, paddingLeft: row.indent ? 20 : 8 }}
                    className="justify-center border-b border-slate-100 bg-slate-100 pr-2 dark:border-slate-800 dark:bg-slate-800">
                    {content}
                  </View>
                );
              }
              return (
                <Pressable
                  key={row.key}
                  style={{ height: ROW_HEIGHT, paddingLeft: row.indent ? 20 : 8 }}
                  className="justify-center border-b border-slate-100 pr-2 dark:border-slate-800"
                  onPress={() =>
                    row.kind === 'group' && row.categoryId != null
                      ? toggleGroup(row.categoryId)
                      : setEditingCategory(categories.find((c) => c.id === row.categoryId) ?? null)
                  }>
                  {content}
                </Pressable>
              );
            })}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              <View
                style={{ height: HEADER_HEIGHT }}
                className="flex-row border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                {months.map((m) => (
                  <Link
                    key={`${m.year}-${m.month}`}
                    href={{ pathname: '/statistics/month', params: { year: String(m.year), month: String(m.month) } }}
                    asChild>
                    <Pressable style={{ width: COL_WIDTH }} className="items-end justify-center pr-2">
                      <Text className="text-xs font-semibold text-primary dark:text-secondary">
                        {monthLabel(m)} ›
                      </Text>
                    </Pressable>
                  </Link>
                ))}
              </View>

              {visibleRows.map((row) =>
                row.kind === 'section' ? (
                  <View
                    key={row.key}
                    style={{ width: COL_WIDTH * months.length, height: ROW_HEIGHT }}
                    className="flex-row bg-slate-100 dark:bg-slate-800">
                    {months.map((m) => (
                      <View
                        key={`${row.key}-${m.year}-${m.month}`}
                        style={{ width: COL_WIDTH }}
                        className="items-end justify-center pr-2">
                        <Text numberOfLines={1} className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {formatKrw(amountFor(m, row))}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View key={row.key} style={{ height: ROW_HEIGHT }} className="flex-row border-b border-slate-100 dark:border-slate-800">
                    {months.map((m) => {
                      const amount = amountFor(m, row);
                      const categoryId = row.categoryId;
                      const key = categoryId != null ? memoKeyFor(categoryId, m.year, m.month) : null;
                      const cellMemo = key != null ? memoMap.get(key) : undefined;
                      const category = categoryId != null ? categoryById.get(categoryId) : undefined;
                      const isOverBudget =
                        category?.type === 'EXPENSE' &&
                        category.targetAmount != null &&
                        amount > category.targetAmount;
                      const cellTarget = categoryId != null
                        ? {
                            categoryId,
                            categoryName: row.label,
                            icon: row.icon,
                            year: m.year,
                            month: m.month,
                            memo: cellMemo ?? null,
                          }
                        : null;
                      const showActions = cellTarget != null && hoveredMemoKey === key;
                      return (
                        <Pressable
                          key={`${row.key}-${m.year}-${m.month}`}
                          style={{ width: COL_WIDTH, position: 'relative' }}
                          className="items-end justify-center pr-2"
                          onPress={() => key != null && setHoveredMemoKey(key)}
                          onHoverIn={() => key != null && setHoveredMemoKey(key)}
                          onHoverOut={() => setHoveredMemoKey((current) => (current === key ? null : current))}>
                          {showActions ? (
                            <View className="flex-row gap-1">
                              <Pressable
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setEditingMemo(cellTarget);
                                  setHoveredMemoKey(null);
                                }}
                                hitSlop={4}
                                style={{ minWidth: 30, minHeight: 26 }}
                                className="items-center justify-center rounded-md bg-slate-100 active:bg-slate-200 dark:bg-slate-700 dark:active:bg-slate-600">
                                <Text className="text-xs">📝</Text>
                              </Pressable>
                              <Pressable
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setViewingSpending(cellTarget);
                                  setHoveredMemoKey(null);
                                }}
                                hitSlop={4}
                                style={{ minWidth: 30, minHeight: 26 }}
                                className="items-center justify-center rounded-md bg-slate-100 active:bg-slate-200 dark:bg-slate-700 dark:active:bg-slate-600">
                                <Text className="text-xs">🧾</Text>
                              </Pressable>
                            </View>
                          ) : (
                            <Text
                              numberOfLines={1}
                              className={
                                isOverBudget
                                  ? `text-xs font-bold text-red-600 dark:text-red-400`
                                  : row.kind === 'group'
                                    ? 'text-xs font-bold text-slate-900 dark:text-white'
                                    : amount === 0
                                      ? 'text-xs text-slate-300 dark:text-slate-600'
                                      : 'text-xs text-slate-700 dark:text-slate-200'
                              }>
                              {formatKrw(amount)}
                            </Text>
                          )}
                          {cellMemo ? (
                            <View
                              pointerEvents="none"
                              style={{ position: 'absolute', top: 3, right: 3 }}
                              className="h-1.5 w-1.5 rounded-full bg-primary"
                            />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                ),
              )}
            </View>
          </ScrollView>
        </View>
      )}

      <CategoryFormModal
        visible={editingCategory !== null}
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
      />
      <CategoryMemoModal visible={editingMemo !== null} target={editingMemo} onClose={() => setEditingMemo(null)} />
      <CategorySpendingDetailModal
        visible={viewingSpending !== null}
        target={viewingSpending}
        onClose={() => setViewingSpending(null)}
      />
    </Screen>
  );
}
