import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { DraggableList } from '@/components/DraggableList';
import { Screen } from '@/components/Screen';
import { useCategories, useCategoryMemos, useReorderCategories } from '@/features/category/api';
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

const INCOME_SECTION_ROW: Row = {
  key: 'section-income', label: '수입', icon: null, categoryId: null, kind: 'section', indent: false,
  parentCategoryId: null, totalType: 'INCOME',
};
const EXPENSE_SECTION_ROW: Row = {
  key: 'section-expense', label: '지출', icon: null, categoryId: null, kind: 'section', indent: false,
  parentCategoryId: null, totalType: 'EXPENSE',
};

/** 대분류(루트) 하나와 그 하위 소분류들을 한 덩어리로 묶는다 — 이 덩어리 단위로
 * 드래그해서 대분류 순서를 바꿀 수 있게 하기 위함. */
function buildRootBlocks(categories: Category[], type: TransactionType): Row[][] {
  const typeCategories = categories.filter((c) => c.type === type);
  const roots = sortBySortOrder(typeCategories.filter((c) => c.parentId == null));
  return roots.map((root) => {
    const children = sortBySortOrder(typeCategories.filter((c) => c.parentId === root.id));
    if (children.length === 0 && !root.isGroup) {
      return [{
        key: `c${root.id}`,
        label: root.name,
        icon: root.icon,
        categoryId: root.id,
        kind: 'leaf' as const,
        indent: false,
        parentCategoryId: null,
      }];
    }
    const rootRow: Row = {
      key: `g${root.id}`,
      label: root.name,
      icon: root.icon,
      categoryId: root.id,
      kind: 'group',
      indent: false,
      parentCategoryId: null,
    };
    const childRows: Row[] = children.map((child) => ({
      key: `c${child.id}`,
      label: child.name,
      icon: child.icon,
      categoryId: child.id,
      kind: 'leaf',
      indent: true,
      parentCategoryId: root.id,
    }));
    return [rootRow, ...childRows];
  });
}

function buildRows(categories: Category[]): Row[] {
  return [
    INCOME_SECTION_ROW,
    ...buildRootBlocks(categories, 'INCOME').flat(),
    EXPENSE_SECTION_ROW,
    ...buildRootBlocks(categories, 'EXPENSE').flat(),
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

// onHoverIn/onHoverOut을 매 렌더마다 새로 만든 인라인 함수로 넘기면, react-native-web의 hover
// 리스너가 다른 셀의 hover 상태가 바뀔 때마다(=이 컴포넌트 트리 전체가 리렌더될 때마다) 매번
// 재바인딩되면서 실제 마우스 이벤트를 놓쳐 버튼이 나타나자마자 사라지는 것처럼 보인다.
// 셀을 별도 컴포넌트로 분리하고 핸들러를 useCallback으로 고정해 이 리바인딩을 없앤다.
//
// 버튼 자체도 hover 상태에 따라 마운트/언마운트하지 않는다 — 버튼을 누르는 순간 press
// responder가 포인터를 캡처하면서 이 셀의 hoverOut이 먼저 발생해, 버튼이 DOM에서 사라진 뒤라
// 클릭이 씹히는 문제가 있었다. 그래서 버튼은 항상 마운트해두고 opacity/pointerEvents만 토글한다.
function StatCell({
  rowKind,
  amount,
  isOverBudget,
  cellKey,
  cellMemo,
  cellTarget,
  hovered,
  setHoveredMemoKey,
  onEditMemo,
  onViewSpending,
}: {
  rowKind: Row['kind'];
  amount: number;
  isOverBudget: boolean;
  cellKey: string | null;
  cellMemo: string | undefined;
  cellTarget: MemoTarget | null;
  hovered: boolean;
  setHoveredMemoKey: (updater: string | null | ((current: string | null) => string | null)) => void;
  onEditMemo: (target: MemoTarget) => void;
  onViewSpending: (target: MemoTarget) => void;
}) {
  const onHoverIn = useCallback(() => {
    if (cellKey != null) setHoveredMemoKey(cellKey);
  }, [cellKey, setHoveredMemoKey]);
  const onHoverOut = useCallback(() => {
    setHoveredMemoKey((current) => (current === cellKey ? null : current));
  }, [cellKey, setHoveredMemoKey]);
  const onPress = useCallback(() => {
    if (cellKey != null) setHoveredMemoKey(cellKey);
  }, [cellKey, setHoveredMemoKey]);

  const showActions = cellTarget != null && hovered;

  return (
    <Pressable
      style={{ width: COL_WIDTH, position: 'relative' }}
      className="items-end justify-center pr-2"
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}>
      <Text
        numberOfLines={1}
        className={
          isOverBudget
            ? `text-xs font-bold text-red-600 dark:text-red-400`
            : rowKind === 'group'
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
      {cellTarget ? (
        <View
          pointerEvents={showActions ? 'auto' : 'none'}
          style={{ position: 'absolute', inset: 0, opacity: showActions ? 1 : 0 }}
          className="flex-row items-center justify-end gap-1 bg-white pr-2 dark:bg-slate-900">
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onEditMemo(cellTarget);
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
              onViewSpending(cellTarget);
              setHoveredMemoKey(null);
            }}
            hitSlop={4}
            style={{ minWidth: 30, minHeight: 26 }}
            className="items-center justify-center rounded-md bg-slate-100 active:bg-slate-200 dark:bg-slate-700 dark:active:bg-slate-600">
            <Text className="text-xs">🧾</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

/** 왼쪽 카테고리 라벨 열의 행 하나. 대분류(그룹)/최상위 소분류 행에는 드래그 손잡이가 붙는다. */
function LabelRow({
  row,
  isCollapsed,
  isDragging,
  dragHandleProps,
  onToggleGroup,
  onEditCategory,
}: {
  row: Row;
  isCollapsed: boolean;
  isDragging?: boolean;
  dragHandleProps?: object;
  onToggleGroup: (categoryId: number) => void;
  onEditCategory: (categoryId: number | null) => void;
}) {
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
        style={{ height: ROW_HEIGHT, paddingLeft: row.indent ? 20 : 8 }}
        className="justify-center border-b border-slate-100 bg-slate-100 pr-2 dark:border-slate-800 dark:bg-slate-800">
        {content}
      </View>
    );
  }

  return (
    <View
      style={{ height: ROW_HEIGHT, paddingLeft: row.indent ? 20 : 8 }}
      className={`flex-row items-center border-b border-slate-100 pr-1 dark:border-slate-800 ${
        isDragging ? 'bg-primary-light dark:bg-slate-700' : ''
      }`}>
      <Pressable
        className="min-w-0 flex-1"
        onPress={() =>
          row.kind === 'group' && row.categoryId != null ? onToggleGroup(row.categoryId) : onEditCategory(row.categoryId)
        }>
        {content}
      </Pressable>
      {dragHandleProps ? (
        <View {...dragHandleProps} className="px-1 py-0.5">
          <Ionicons name="reorder-three-outline" size={14} color="#94a3b8" />
        </View>
      ) : null}
    </View>
  );
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
  const reorderCategories = useReorderCategories();

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
  const incomeRootBlocks = useMemo(() => buildRootBlocks(categories, 'INCOME'), [categories]);
  const expenseRootBlocks = useMemo(() => buildRootBlocks(categories, 'EXPENSE'), [categories]);
  const handleReorderRoots = (blocks: Row[][]) => {
    reorderCategories.mutate(blocks.map((block) => block[0].categoryId!));
  };
  const months = useMemo(() => [...(range?.months ?? [])].reverse(), [range]);

  return (
    <Screen maxWidthClassName="max-w-[1200px]">
      <Text className="text-xs text-slate-400">
        처음 거래를 기록한 달부터 이번 달까지예요. 월을 누르면 자세히 볼 수 있어요. 대분류 옆 ⋮ 아이콘을 끌면 순서를 바꿀 수 있어요.
      </Text>

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
            <LabelRow
              row={INCOME_SECTION_ROW}
              isCollapsed={false}
              onToggleGroup={toggleGroup}
              onEditCategory={() => {}}
            />
            <DraggableList
              items={incomeRootBlocks}
              keyExtractor={(block) => block[0].key}
              onReorder={handleReorderRoots}
              renderItem={({ item: block, isDragging, dragHandleProps }) => (
                <View>
                  {(collapsedGroups.has(block[0].categoryId!) ? [block[0]] : block).map((row) => (
                    <LabelRow
                      key={row.key}
                      row={row}
                      isCollapsed={row.categoryId != null && collapsedGroups.has(row.categoryId)}
                      isDragging={row.key === block[0].key && isDragging}
                      dragHandleProps={row.key === block[0].key ? dragHandleProps : undefined}
                      onToggleGroup={toggleGroup}
                      onEditCategory={(categoryId) =>
                        setEditingCategory(categories.find((c) => c.id === categoryId) ?? null)
                      }
                    />
                  ))}
                </View>
              )}
            />
            <LabelRow
              row={EXPENSE_SECTION_ROW}
              isCollapsed={false}
              onToggleGroup={toggleGroup}
              onEditCategory={() => {}}
            />
            <DraggableList
              items={expenseRootBlocks}
              keyExtractor={(block) => block[0].key}
              onReorder={handleReorderRoots}
              renderItem={({ item: block, isDragging, dragHandleProps }) => (
                <View>
                  {(collapsedGroups.has(block[0].categoryId!) ? [block[0]] : block).map((row) => (
                    <LabelRow
                      key={row.key}
                      row={row}
                      isCollapsed={row.categoryId != null && collapsedGroups.has(row.categoryId)}
                      isDragging={row.key === block[0].key && isDragging}
                      dragHandleProps={row.key === block[0].key ? dragHandleProps : undefined}
                      onToggleGroup={toggleGroup}
                      onEditCategory={(categoryId) =>
                        setEditingCategory(categories.find((c) => c.id === categoryId) ?? null)
                      }
                    />
                  ))}
                </View>
              )}
            />
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
                      return (
                        <StatCell
                          key={`${row.key}-${m.year}-${m.month}`}
                          rowKind={row.kind}
                          amount={amount}
                          isOverBudget={isOverBudget}
                          cellKey={key}
                          cellMemo={cellMemo}
                          cellTarget={cellTarget}
                          hovered={hoveredMemoKey === key}
                          setHoveredMemoKey={setHoveredMemoKey}
                          onEditMemo={setEditingMemo}
                          onViewSpending={setViewingSpending}
                        />
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
