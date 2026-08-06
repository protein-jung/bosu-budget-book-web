import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useCategories } from '@/features/category/api';
import { CategoryFormModal } from '@/features/category/CategoryFormModal';
import type { Category } from '@/lib/types';

export default function CategoriesScreen() {
  const { data: categories = [] } = useCategories();
  const [editing, setEditing] = useState<Category | null | undefined>(undefined);

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');
  const incomeCategories = categories.filter((c) => c.type === 'INCOME');

  const renderGroup = (title: string, items: Category[]) => (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</Text>
      {items.length === 0 ? (
        <Text className="text-sm text-slate-400">아직 카테고리가 없어요.</Text>
      ) : (
        items.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => setEditing(category)}
            className="flex-row items-center gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
            <View className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color ?? '#94a3b8' }} />
            <Text className="flex-1 text-base text-slate-900 dark:text-white">{category.name}</Text>
          </Pressable>
        ))
      )}
    </View>
  );

  return (
    <Screen>
      {renderGroup('지출', expenseCategories)}
      {renderGroup('수입', incomeCategories)}

      <Pressable onPress={() => setEditing(null)} className="items-center rounded-xl bg-blue-600 p-4">
        <Text className="font-semibold text-white">+ 카테고리 추가</Text>
      </Pressable>

      <CategoryFormModal visible={editing !== undefined} onClose={() => setEditing(undefined)} category={editing} />
    </Screen>
  );
}
