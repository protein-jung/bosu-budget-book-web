import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useCategories, useUpdateCategory } from '@/features/category/api';
import { CategoryFormModal } from '@/features/category/CategoryFormModal';
import { useMyHousehold } from '@/features/household/api';
import { BudgetTargetModal } from '@/features/statistics/BudgetTargetModal';
import { useMonthlyStatistics } from '@/features/statistics/api';
import { formatKrw } from '@/lib/format';
import { CATEGORY_COLOR_PALETTE } from '@/lib/palette';
import type { Category, CategoryBudget, TransactionType } from '@/lib/types';

function sortedCategories(items: Category[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

// 카테고리 자체의 기본 목표금액이 설정돼있는지를 "이 카테고리를 예산에 포함시켰다"는 신호로 쓴다.
// 카테고리 수정 폼에서 목표금액을 지우면 다시 예산 탭에서 빠진다.
function isSelected(category: Category) {
  return category.targetAmount != null;
}

function CategoryChip({ category, onPress }: { category: Category; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1.5 rounded-full border border-slate-200 bg-cream px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
      {category.icon ? (
        <Text className="text-sm">{category.icon}</Text>
      ) : (
        <View className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color ?? '#94a3b8' }} />
      )}
      <Text className="text-sm text-slate-700 dark:text-slate-200">{category.name}</Text>
    </Pressable>
  );
}

export default function BudgetScreen() {
  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [addOpenType, setAddOpenType] = useState<TransactionType | null>(null);
  const [addParentId, setAddParentId] = useState<number | null>(null);
  const [addingCategory, setAddingCategory] = useState<Category | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: household } = useMyHousehold();
  const { data: summary, isLoading } = useMonthlyStatistics(year, month);
  const updateCategory = useUpdateCategory();

  const spentByCategoryId = useMemo(
    () => new Map((summary?.byCategory ?? []).map((s) => [s.categoryId, s.amount])),
    [summary],
  );

  // 목표금액을 등록해서 직접 추가한 카테고리뿐 아니라, 이번 달에 실제로 쓴 카테고리도 (아직
  // 목표는 없더라도) 예산 화면에 자동으로 잡아준다 — 얼마 썼는지는 봐야 하니까.
  const hasSpendingThisMonth = (category: Category) => (spentByCategoryId.get(category.id) ?? 0) > 0;
  const isVisible = (category: Category) => isSelected(category) || hasSpendingThisMonth(category);

  const toBudget = (category: Category): CategoryBudget => ({
    categoryId: category.id,
    categoryName: category.name,
    color: category.color,
    icon: category.icon,
    type: category.type,
    targetAmount: category.targetAmount ?? 0,
    spentAmount: spentByCategoryId.get(category.id) ?? 0,
  });

  const expenseRoots = useMemo(
    () => sortedCategories(categories.filter((c) => c.type === 'EXPENSE' && c.parentId == null)),
    [categories],
  );
  const incomeRoots = useMemo(
    () => sortedCategories(categories.filter((c) => c.type === 'INCOME' && c.parentId == null)),
    [categories],
  );
  const childrenOf = (parentId: number) => sortedCategories(categories.filter((c) => c.parentId === parentId));

  const handleUnselect = (category: Category) => {
    updateCategory.mutate({
      id: category.id,
      data: {
        name: category.name,
        type: category.type,
        color: category.color ?? CATEGORY_COLOR_PALETTE[0],
        icon: category.icon,
        parentId: category.parentId,
        targetAmount: null,
        isGroup: category.isGroup,
      },
    });
  };

  // 예산 입력은 하위(세부) 카테고리에서만 하고, 하위가 있는 상위 카테고리는 그 합계를 보여주기만 한다.
  // 하위가 없는 상위 카테고리는 그 자체가 세부 항목이므로 직접 입력할 수 있다.
  const renderLeafRow = (category: Category) => {
    const budget = toBudget(category);
    const hasTarget = budget.targetAmount > 0;
    const pct = hasTarget ? Math.min(100, Math.round((budget.spentAmount / budget.targetAmount) * 100)) : 0;
    const over = hasTarget && budget.spentAmount > budget.targetAmount;
    const barColor = over ? '#e03131' : pct >= 80 ? '#f08c00' : '#2f9e44';

    return (
      <View key={category.id} className="flex-row items-center gap-2">
        <Pressable onPress={() => setEditingCategory(category)} className="min-w-0 flex-1 gap-1.5">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-sm text-slate-700 dark:text-slate-200" numberOfLines={1}>
              {budget.icon ? `${budget.icon} ` : ''}
              {budget.categoryName}
            </Text>
            <Text className={`text-sm font-medium ${over ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
              {formatKrw(budget.spentAmount)} / {formatKrw(budget.targetAmount)}
            </Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <View
              className="h-full rounded-full"
              style={{ width: `${Math.max(pct, budget.spentAmount > 0 ? 3 : 0)}%`, backgroundColor: barColor }}
            />
          </View>
        </Pressable>
        {isSelected(category) ? (
          <Pressable onPress={() => handleUnselect(category)} className="px-1 py-1">
            <Ionicons name="close-circle-outline" size={18} color="#94a3b8" />
          </Pressable>
        ) : null}
      </View>
    );
  };

  const renderParentTotalRow = (root: Category, children: Category[]) => {
    const budgets = children.map(toBudget);
    const targetAmount = budgets.reduce((sum, b) => sum + b.targetAmount, 0);
    const spentAmount = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    const hasTarget = targetAmount > 0;
    const pct = hasTarget ? Math.min(100, Math.round((spentAmount / targetAmount) * 100)) : 0;
    const over = hasTarget && spentAmount > targetAmount;
    const barColor = over ? '#e03131' : pct >= 80 ? '#f08c00' : '#2f9e44';

    return (
      <View className="gap-1.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200" numberOfLines={1}>
            {root.icon ? `${root.icon} ` : ''}
            {root.name} 합계
          </Text>
          <Text className={`text-sm font-medium ${over ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
            {formatKrw(spentAmount)} / {formatKrw(targetAmount)}
          </Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <View
            className="h-full rounded-full"
            style={{ width: `${Math.max(pct, spentAmount > 0 ? 3 : 0)}%`, backgroundColor: barColor }}
          />
        </View>
      </View>
    );
  };

  const addableRoots = (type: TransactionType) =>
    sortedCategories(categories.filter((c) => c.type === type && c.parentId == null)).filter((root) => {
      const children = childrenOf(root.id);
      return children.length > 0 ? children.some((c) => !isVisible(c)) : !isVisible(root);
    });

  const renderSection = (title: string, type: TransactionType, roots: Category[]) => {
    const groups = roots
      .map((root) => ({ root, children: childrenOf(root.id) }))
      .map(({ root, children }) => ({
        root,
        children,
        selectedChildren: children.filter(isVisible),
      }))
      .filter(
        ({ root, children, selectedChildren }) =>
          (children.length > 0 && selectedChildren.length > 0) || (children.length === 0 && isVisible(root)),
      );

    const isAddOpen = addOpenType === type;
    const parent = addParentId != null ? categories.find((c) => c.id === addParentId) : null;

    return (
      <View className="gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-slate-900 dark:text-white">{title}</Text>
          <Pressable
            onPress={() => {
              setAddOpenType(isAddOpen ? null : type);
              setAddParentId(null);
            }}
            className="flex-row items-center gap-1 px-2 py-1">
            <Ionicons name={isAddOpen ? 'remove-circle-outline' : 'add-circle-outline'} size={16} color="#1F6F5C" />
            <Text className="text-sm font-medium text-primary">{isAddOpen ? '닫기' : '카테고리 추가'}</Text>
          </Pressable>
        </View>

        {isAddOpen ? (
          <View className="gap-2 rounded-xl bg-cream p-3 dark:bg-slate-800">
            {parent == null ? (
              <>
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  상위 카테고리를 먼저 선택하세요
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {addableRoots(type).map((root) => (
                    <CategoryChip
                      key={root.id}
                      category={root}
                      onPress={() => {
                        const children = childrenOf(root.id);
                        if (children.length > 0) {
                          setAddParentId(root.id);
                        } else {
                          setAddingCategory(root);
                        }
                      }}
                    />
                  ))}
                  {addableRoots(type).length === 0 ? (
                    <Text className="text-sm text-slate-400">추가할 수 있는 카테고리가 없어요.</Text>
                  ) : null}
                </View>
              </>
            ) : (
              <>
                <View className="flex-row items-center gap-1">
                  <Pressable onPress={() => setAddParentId(null)} className="py-1 pr-1">
                    <Ionicons name="chevron-back" size={16} color="#1F6F5C" />
                  </Pressable>
                  <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {parent.name}의 하위 카테고리를 선택하세요
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {childrenOf(parent.id)
                    .filter((c) => !isVisible(c))
                    .map((child) => (
                      <CategoryChip key={child.id} category={child} onPress={() => setAddingCategory(child)} />
                    ))}
                  {childrenOf(parent.id).filter((c) => !isVisible(c)).length === 0 ? (
                    <Text className="text-sm text-slate-400">추가할 수 있는 하위 카테고리가 없어요.</Text>
                  ) : null}
                </View>
              </>
            )}
          </View>
        ) : null}

        {groups.length === 0 ? (
          <Text className="text-sm text-slate-400">아직 예산에 추가한 카테고리가 없어요.</Text>
        ) : (
          groups.map(({ root, children, selectedChildren }) => (
            <View key={root.id} className="gap-2">
              {children.length > 0 ? renderParentTotalRow(root, selectedChildren) : renderLeafRow(root)}
              {selectedChildren.length > 0 ? (
                <View className="ml-4 gap-2 border-l border-slate-100 pl-3 dark:border-slate-800">
                  {selectedChildren.map((child) => renderLeafRow(child))}
                </View>
              ) : null}
            </View>
          ))
        )}
      </View>
    );
  };

  return (
    <Screen>
      <View className="gap-1">
        <Text className="text-lg font-bold text-slate-900 dark:text-white">예산</Text>
        <Text className="text-xs text-slate-400">
          목표금액을 등록해 직접 추가한 카테고리와, 목표는 없어도 이번 달에 사용한 카테고리가 함께 보여요.
        </Text>
      </View>

      {household && household.members.length > 0 ? (
        <Text className="text-xs text-slate-400">
          함께하는 사람: {household.members.map((m) => m.name).join(', ')}
        </Text>
      ) : null}

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <>
          {renderSection('지출', 'EXPENSE', expenseRoots)}
          {renderSection('수입', 'INCOME', incomeRoots)}
        </>
      )}

      <BudgetTargetModal
        visible={editingCategory !== null}
        onClose={() => setEditingCategory(null)}
        category={editingCategory}
      />

      <CategoryFormModal
        visible={addingCategory !== null}
        onClose={() => setAddingCategory(null)}
        category={addingCategory}
      />
    </Screen>
  );
}
