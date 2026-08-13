import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { DraggableList } from '@/components/DraggableList';
import { Screen } from '@/components/Screen';
import { useCategories, useCategoryMemos } from '@/features/category/api';
import { CategoryFormModal } from '@/features/category/CategoryFormModal';
import { useFullHistoryStatistics } from '@/features/statistics/api';
import { CategoryMemoModal, type MemoTarget } from '@/features/statistics/CategoryMemoModal';
import { formatKrw } from '@/lib/format';
import { storage } from '@/lib/storage';
import type { Category, MonthlyTrendPoint, TransactionType } from '@/lib/types';

const LABEL_WIDTH = 132;
const COL_WIDTH = 96;
const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 34;
const ORDER_STORAGE_KEY = 'housebook_stats_category_order';

type Row = {
  key: string;
  label: string;
  icon: string | null;
  categoryId: number | null;
  kind: 'section' | 'group' | 'leaf';
  indent: boolean;
  /** 이 행이 어느 대분류(그룹)의 하위 행인지. 그 대분류가 접혀 있으면 이 행은 숨긴다. */
  parentCategoryId: number | null;
};

/** 이 페이지에서만 쓰는 로컬 정렬 순서. 지정 안 된 카테고리는 원래 sortOrder를 따른다. */
function sortWithOrder(items: Category[], order: Record<number, number>) {
  return [...items].sort((a, b) => {
    const oa = order[a.id] ?? a.sortOrder;
    const ob = order[b.id] ?? b.sortOrder;
    return oa - ob || a.id - b.id;
  });
}

function buildTypeRows(categories: Category[], type: TransactionType, order: Record<number, number>): Row[] {
  const typeCategories = categories.filter((c) => c.type === type);
  const roots = sortWithOrder(typeCategories.filter((c) => c.parentId == null), order);
  const rows: Row[] = [];
  for (const root of roots) {
    const children = sortWithOrder(typeCategories.filter((c) => c.parentId === root.id), order);
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

function buildRows(categories: Category[], order: Record<number, number>): Row[] {
  return [
    { key: 'section-income', label: '수입', icon: null, categoryId: null, kind: 'section', indent: false, parentCategoryId: null },
    ...buildTypeRows(categories, 'INCOME', order),
    { key: 'section-expense', label: '지출', icon: null, categoryId: null, kind: 'section', indent: false, parentCategoryId: null },
    ...buildTypeRows(categories, 'EXPENSE', order),
  ];
}

function amountFor(point: MonthlyTrendPoint, row: Row): number {
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

function OrderRow({
  category,
  isDragging,
  dragHandleProps,
  compact,
}: {
  category: Category;
  isDragging: boolean;
  dragHandleProps: object;
  compact?: boolean;
}) {
  return (
    <View
      {...dragHandleProps}
      style={{ height: compact ? 40 : 44 }}
      className={`mb-1.5 flex-row items-center gap-2 rounded-xl px-3 ${
        isDragging ? 'bg-primary-light dark:bg-slate-700' : compact ? 'bg-white/80 dark:bg-slate-900/80' : 'bg-white dark:bg-slate-900'
      }`}>
      <Ionicons name="reorder-three-outline" size={16} color="#94a3b8" />
      <Text className={compact ? 'text-sm text-slate-700 dark:text-slate-200' : 'text-sm font-medium text-slate-900 dark:text-white'}>
        {category.icon ? `${category.icon} ` : ''}
        {category.name}
      </Text>
    </View>
  );
}

export default function StatisticsScreen() {
  const { data: categories = [] } = useCategories();
  const { data: range, isLoading } = useFullHistoryStatistics();
  const { data: memos = [] } = useCategoryMemos();
  const [order, setOrder] = useState<Record<number, number>>({});
  const [editingOrder, setEditingOrder] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingMemo, setEditingMemo] = useState<MemoTarget | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    storage.getItem(ORDER_STORAGE_KEY).then((raw) => {
      if (cancelled || !raw) return;
      try {
        setOrder(JSON.parse(raw));
      } catch {
        // 저장된 값이 손상된 경우 기본 순서를 사용한다.
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persistOrder = (next: Record<number, number>) => {
    setOrder(next);
    storage.setItem(ORDER_STORAGE_KEY, JSON.stringify(next));
  };

  const applyGroupOrder = (items: Category[]) => {
    const next = { ...order };
    items.forEach((c, index) => {
      next[c.id] = index;
    });
    persistOrder(next);
  };

  const resetOrder = () => {
    setOrder({});
    storage.removeItem(ORDER_STORAGE_KEY);
  };

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const rows = useMemo(() => buildRows(categories, order), [categories, order]);
  const visibleRows = useMemo(
    () => rows.filter((row) => row.parentCategoryId == null || !collapsedGroups.has(row.parentCategoryId)),
    [rows, collapsedGroups],
  );
  const months = useMemo(() => [...(range?.months ?? [])].reverse(), [range]);
  const hasCustomOrder = Object.keys(order).length > 0;

  // DraggableList는 items 참조가 매 렌더마다 새로 생기면 내부 상태를 계속 리셋하므로,
  // order/categories가 실제로 바뀔 때만 배열을 새로 만들도록 미리 계산해 둔다.
  const orderSections = useMemo(() => {
    const build = (type: TransactionType, title: string) => {
      const roots = sortWithOrder(categories.filter((c) => c.type === type && c.parentId == null), order);
      const groups = roots.map((root) => ({
        root,
        children: sortWithOrder(categories.filter((c) => c.parentId === root.id), order),
      }));
      return { type, title, roots, groups };
    };
    return [build('INCOME', '수입'), build('EXPENSE', '지출')];
  }, [categories, order]);

  const renderOrderSection = (section: (typeof orderSections)[number]) => {
    if (section.groups.length === 0) return null;
    return (
      <View key={section.type} className="gap-2">
        <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">{section.title}</Text>
        <DraggableList
          items={section.roots}
          keyExtractor={(item) => String(item.id)}
          onReorder={applyGroupOrder}
          renderItem={({ item, isDragging, dragHandleProps }) => (
            <OrderRow category={item} isDragging={isDragging} dragHandleProps={dragHandleProps} />
          )}
        />
        {section.groups.map(({ root, children }) => {
          if (children.length === 0) return null;
          return (
            <View key={root.id} className="ml-4 gap-1">
              <Text className="text-xs text-slate-400">{root.name} 하위</Text>
              <DraggableList
                items={children}
                keyExtractor={(item) => String(item.id)}
                onReorder={applyGroupOrder}
                renderItem={({ item, isDragging, dragHandleProps }) => (
                  <OrderRow category={item} isDragging={isDragging} dragHandleProps={dragHandleProps} compact />
                )}
              />
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Screen maxWidthClassName="max-w-[1200px]">
      <Text className="text-xs text-slate-400">처음 거래를 기록한 달부터 이번 달까지예요. 월을 누르면 자세히 볼 수 있어요.</Text>

      <View className="gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
        <Pressable onPress={() => setEditingOrder((v) => !v)} className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-slate-900 dark:text-white">
            카테고리 순서 편집 (이 표에만 적용)
          </Text>
          <Text className="text-sm text-primary dark:text-secondary">{editingOrder ? '접기 ▴' : '펼치기 ▾'}</Text>
        </Pressable>

        {editingOrder ? (
          <View className="gap-4 border-t border-slate-100 pt-3 dark:border-slate-800">
            <Text className="text-xs text-slate-400">
              드래그해서 순서를 바꿀 수 있어요. 다른 화면(카테고리 관리 등)에는 영향을 주지 않아요.
            </Text>
            {orderSections.map(renderOrderSection)}
            {hasCustomOrder ? (
              <Pressable onPress={resetOrder} className="items-center rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                <Text className="text-sm font-medium text-slate-600 dark:text-slate-300">기본 순서로 되돌리기</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

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
                    className="bg-slate-100 dark:bg-slate-800"
                  />
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
                      return (
                        <Pressable
                          key={`${row.key}-${m.year}-${m.month}`}
                          style={{ width: COL_WIDTH, position: 'relative' }}
                          className="items-end justify-center pr-2"
                          onPress={() => {
                            if (categoryId == null) return;
                            setEditingMemo({
                              categoryId,
                              categoryName: row.label,
                              icon: row.icon,
                              year: m.year,
                              month: m.month,
                              memo: cellMemo ?? null,
                            });
                          }}
                          onHoverIn={() => key != null && setHoveredMemoKey(key)}
                          onHoverOut={() => setHoveredMemoKey((current) => (current === key ? null : current))}>
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
                          {cellMemo ? (
                            <View
                              pointerEvents="none"
                              style={{ position: 'absolute', top: 3, right: 3 }}
                              className="h-1.5 w-1.5 rounded-full bg-primary"
                            />
                          ) : null}
                          {cellMemo && hoveredMemoKey === key ? (
                            <View
                              pointerEvents="none"
                              style={{ position: 'absolute', bottom: '100%', right: 0, zIndex: 50, marginBottom: 4, maxWidth: 200 }}
                              className="rounded-lg bg-slate-900 px-2.5 py-1.5 shadow-lg dark:bg-slate-700">
                              <Text className="text-xs text-white">{cellMemo}</Text>
                            </View>
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
    </Screen>
  );
}
