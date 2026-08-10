import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { DraggableList } from '@/components/DraggableList';
import { Screen } from '@/components/Screen';
import { useCategories, useReorderCategories, useUpdateCategory } from '@/features/category/api';
import { CategoryFormModal } from '@/features/category/CategoryFormModal';
import { formatAmountInput, formatCompactKrw } from '@/lib/format';
import { CATEGORY_COLOR_PALETTE } from '@/lib/palette';
import { useIsDesktop } from '@/lib/responsive';
import type { Category } from '@/lib/types';

function sortedCategories(items: Category[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

/** 피시 화면 전용: 별도 저장 버튼 없이, 입력 후 포커스를 벗어나면 바로 저장한다. */
function TargetAmountInlineInput({
  value,
  onSave,
  compact,
}: {
  value: number | null;
  onSave: (amount: number | null) => void;
  compact?: boolean;
}) {
  const [prevValue, setPrevValue] = useState(value);
  const [text, setText] = useState(value != null ? String(value) : '');

  if (value !== prevValue) {
    setPrevValue(value);
    setText(value != null ? String(value) : '');
  }

  const handleBlur = () => {
    const numeric = text.trim() ? Number(text) : null;
    if (numeric !== value) {
      onSave(numeric);
    }
  };

  return (
    <TextInput
      value={formatAmountInput(text)}
      onChangeText={(t) => setText(t.replace(/[^0-9]/g, ''))}
      onBlur={handleBlur}
      keyboardType="numeric"
      placeholder="목표 금액"
      placeholderTextColor="#94a3b8"
      className={`w-28 rounded-lg border border-slate-200 bg-cream px-2 text-right text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 ${
        compact ? 'py-1 text-xs' : 'py-1.5 text-sm'
      }`}
    />
  );
}

function CategoryRow({
  category,
  isDragging,
  dragHandleProps,
  onPress,
  onSaveTarget,
  isDesktop,
  compact,
}: {
  category: Category;
  isDragging: boolean;
  dragHandleProps: object;
  onPress: () => void;
  onSaveTarget: (category: Category, amount: number | null) => void;
  isDesktop: boolean;
  compact?: boolean;
}) {
  return (
    <View
      className={`mb-2 flex-row items-center gap-2 rounded-xl p-4 ${
        isDragging
          ? 'bg-primary-light dark:bg-slate-700'
          : compact
            ? 'bg-white/80 dark:bg-slate-900/80'
            : 'bg-white dark:bg-slate-900'
      } ${compact ? 'py-3' : ''}`}>
      <Pressable onPress={onPress} className="flex-1 flex-row items-center gap-3">
        {category.icon ? (
          <Text className={compact ? 'text-base' : 'text-lg'}>{category.icon}</Text>
        ) : (
          <View
            className={compact ? 'h-2.5 w-2.5 rounded-full' : 'h-3 w-3 rounded-full'}
            style={{ backgroundColor: category.color ?? '#94a3b8' }}
          />
        )}
        <Text
          className={
            compact
              ? 'flex-1 text-sm text-slate-700 dark:text-slate-200'
              : 'flex-1 text-base font-medium text-slate-900 dark:text-white'
          }>
          {category.name}
        </Text>
        {!isDesktop && category.targetAmount != null ? (
          <Text className={compact ? 'text-xs text-slate-400' : 'text-sm text-slate-400'}>
            목표 {formatCompactKrw(category.targetAmount)}원
          </Text>
        ) : null}
      </Pressable>
      {isDesktop ? (
        <TargetAmountInlineInput
          value={category.targetAmount}
          onSave={(amount) => onSaveTarget(category, amount)}
          compact={compact}
        />
      ) : null}
      <View {...dragHandleProps} className="px-1 py-1">
        <Ionicons name="reorder-three-outline" size={22} color="#94a3b8" />
      </View>
    </View>
  );
}

export default function CategoriesScreen() {
  const { data: categories = [] } = useCategories();
  const reorderCategories = useReorderCategories();
  const updateCategory = useUpdateCategory();
  const isDesktop = useIsDesktop();
  const [editing, setEditing] = useState<Category | null | undefined>(undefined);

  const expenseRoots = useMemo(
    () => sortedCategories(categories.filter((c) => c.type === 'EXPENSE' && c.parentId == null)),
    [categories],
  );
  const incomeRoots = useMemo(
    () => sortedCategories(categories.filter((c) => c.type === 'INCOME' && c.parentId == null)),
    [categories],
  );

  const childrenOf = (parentId: number) => sortedCategories(categories.filter((c) => c.parentId === parentId));

  const handleReorder = (data: Category[]) => {
    reorderCategories.mutate(data.map((c) => c.id));
  };

  const handleSaveTarget = (category: Category, amount: number | null) => {
    updateCategory.mutate({
      id: category.id,
      data: {
        name: category.name,
        type: category.type,
        color: category.color ?? CATEGORY_COLOR_PALETTE[0],
        icon: category.icon,
        parentId: category.parentId,
        targetAmount: amount,
      },
    });
  };

  const renderTypeSection = (title: string, roots: Category[]) => (
    <View className="gap-3">
      <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</Text>
      {roots.length === 0 ? (
        <Text className="text-sm text-slate-400">아직 카테고리가 없어요.</Text>
      ) : (
        <>
          <DraggableList
            items={roots}
            keyExtractor={(item) => String(item.id)}
            onReorder={handleReorder}
            renderItem={({ item, isDragging, dragHandleProps }) => (
              <CategoryRow
                category={item}
                isDragging={isDragging}
                dragHandleProps={dragHandleProps}
                onPress={() => setEditing(item)}
                onSaveTarget={handleSaveTarget}
                isDesktop={isDesktop}
              />
            )}
          />
          {roots.map((root) => {
            const children = childrenOf(root.id);
            if (children.length === 0) return null;
            return (
              <View key={root.id} className="ml-4 gap-1.5">
                <Text className="text-xs text-slate-400">{root.name} 하위</Text>
                <DraggableList
                  items={children}
                  keyExtractor={(item) => String(item.id)}
                  onReorder={handleReorder}
                  renderItem={({ item, isDragging, dragHandleProps }) => (
                    <CategoryRow
                      category={item}
                      isDragging={isDragging}
                      dragHandleProps={dragHandleProps}
                      onPress={() => setEditing(item)}
                      onSaveTarget={handleSaveTarget}
                      isDesktop={isDesktop}
                      compact
                    />
                  )}
                />
              </View>
            );
          })}
        </>
      )}
    </View>
  );

  return (
    <Screen>
      <Text className="text-xs text-slate-400">카드 오른쪽의 아이콘을 눌러서 끌면 순서를 바꿀 수 있어요.</Text>
      {renderTypeSection('지출', expenseRoots)}
      {renderTypeSection('수입', incomeRoots)}

      <Pressable onPress={() => setEditing(null)} className="items-center rounded-xl bg-primary p-4">
        <Text className="font-semibold text-white">+ 카테고리 추가</Text>
      </Pressable>

      <CategoryFormModal visible={editing !== undefined} onClose={() => setEditing(undefined)} category={editing} />
    </Screen>
  );
}
