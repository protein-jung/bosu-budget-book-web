import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useCategories, useUpdateCategory } from '@/features/category/api';
import { CategoryFormModal } from '@/features/category/CategoryFormModal';
import { useMyHousehold } from '@/features/household/api';
import { BudgetTargetModal } from '@/features/statistics/BudgetTargetModal';
import { formatKrw } from '@/lib/format';
import { CATEGORY_COLOR_PALETTE } from '@/lib/palette';
import { useIsDesktop } from '@/lib/responsive';
import type { Category, TransactionType } from '@/lib/types';

function sortedCategories(items: Category[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

// 카테고리 자체의 목표금액이 설정돼있는지를 "이 카테고리를 예산에 포함시켰다"는 신호로 쓴다.
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
  const isDesktop = useIsDesktop();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [addOpenType, setAddOpenType] = useState<TransactionType | null>(null);
  const [addParentId, setAddParentId] = useState<number | null>(null);
  const [addingCategory, setAddingCategory] = useState<Category | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: household } = useMyHousehold();
  const updateCategory = useUpdateCategory();

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
  const renderLeafRow = (category: Category) => (
    <View key={category.id} className="flex-row items-center gap-2">
      <Pressable
        onPress={() => setEditingCategory(category)}
        className="min-w-0 flex-1 flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-sm text-slate-700 dark:text-slate-200" numberOfLines={1}>
          {category.icon ? `${category.icon} ` : ''}
          {category.name}
        </Text>
        <Text className="text-sm font-medium text-slate-900 dark:text-white">
          {formatKrw(category.targetAmount ?? 0)}
        </Text>
      </Pressable>
      {isSelected(category) ? (
        <Pressable onPress={() => handleUnselect(category)} className="px-1 py-1">
          <Ionicons name="close-circle-outline" size={18} color="#94a3b8" />
        </Pressable>
      ) : null}
    </View>
  );

  const renderParentTotalRow = (root: Category, children: Category[]) => {
    const targetAmount = children.reduce((sum, c) => sum + (c.targetAmount ?? 0), 0);
    return (
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200" numberOfLines={1}>
          {root.icon ? `${root.icon} ` : ''}
          {root.name} 합계
        </Text>
        <Text className="text-sm font-medium text-slate-900 dark:text-white">{formatKrw(targetAmount)}</Text>
      </View>
    );
  };

  const addableRoots = (type: TransactionType) =>
    sortedCategories(categories.filter((c) => c.type === type && c.parentId == null)).filter((root) => {
      const children = childrenOf(root.id);
      return children.length > 0 ? children.some((c) => !isSelected(c)) : !isSelected(root);
    });

  const renderSection = (title: string, type: TransactionType, roots: Category[]) => {
    const groups = roots
      .map((root) => ({ root, children: childrenOf(root.id) }))
      .map(({ root, children }) => ({
        root,
        children,
        selectedChildren: children.filter(isSelected),
      }))
      .filter(
        ({ root, children, selectedChildren }) =>
          (children.length > 0 && selectedChildren.length > 0) || (children.length === 0 && isSelected(root)),
      );

    const isAddOpen = addOpenType === type;
    const parent = addParentId != null ? categories.find((c) => c.id === addParentId) : null;

    const totalBudget = groups.reduce(
      (sum, { root, children, selectedChildren }) =>
        sum +
        (children.length > 0
          ? selectedChildren.reduce((s, c) => s + (c.targetAmount ?? 0), 0)
          : (root.targetAmount ?? 0)),
      0,
    );

    return (
      <View className="flex-1 gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-baseline gap-2">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">{title}</Text>
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {title === '지출' ? '지출 예산합' : '수입 예산합'} {formatKrw(totalBudget)}
            </Text>
          </View>
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
                    .filter((c) => !isSelected(c))
                    .map((child) => (
                      <CategoryChip key={child.id} category={child} onPress={() => setAddingCategory(child)} />
                    ))}
                  {childrenOf(parent.id).filter((c) => !isSelected(c)).length === 0 ? (
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
    <Screen maxWidthClassName={isDesktop ? 'max-w-[900px]' : 'max-w-[480px]'}>
      <View className="gap-1">
        <Text className="text-lg font-bold text-slate-900 dark:text-white">예산</Text>
        <Text className="text-xs text-slate-400">목표금액을 등록한 카테고리의 예산만 보여요.</Text>
      </View>

      {household && household.members.length > 0 ? (
        <Text className="text-xs text-slate-400">
          함께하는 사람: {household.members.map((m) => m.name).join(', ')}
        </Text>
      ) : null}

      <View className={isDesktop ? 'flex-row gap-3' : 'gap-3'}>
        {renderSection('지출', 'EXPENSE', expenseRoots)}
        {renderSection('수입', 'INCOME', incomeRoots)}
      </View>

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
