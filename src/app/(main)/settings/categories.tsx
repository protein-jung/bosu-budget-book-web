import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { DraggableList } from '@/components/DraggableList';
import { Screen } from '@/components/Screen';
import { useCategories, useReorderCategories, useUpdateCategory } from '@/features/category/api';
import { CategoryFormModal } from '@/features/category/CategoryFormModal';
import { CATEGORY_COLOR_PALETTE } from '@/lib/palette';
import { useIsDesktop } from '@/lib/responsive';
import type { Category } from '@/lib/types';

function sortedCategories(items: Category[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

function CategoryRow({
  category,
  indented,
  isDragging,
  dragHandleProps,
  onPress,
  viewRef,
  collapsible,
  collapsed,
  onToggleCollapse,
}: {
  category: Category;
  indented?: boolean;
  isDragging: boolean;
  dragHandleProps: object;
  onPress: () => void;
  viewRef?: (ref: View | null) => void;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <View
      ref={viewRef}
      className={`mb-1.5 flex-row items-center gap-1 rounded-lg border px-2 py-1.5 ${indented ? 'ml-4' : ''} ${
        isDragging
          ? 'border-primary bg-primary-light dark:bg-slate-700'
          : category.isGroup
            ? 'border-dashed border-primary/50 bg-primary-light/40 dark:border-primary/40 dark:bg-slate-800'
            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
      }`}>
      {collapsible ? (
        <Pressable onPress={onToggleCollapse} hitSlop={6} className="px-0.5 py-0.5">
          <Ionicons name={collapsed ? 'chevron-forward' : 'chevron-down'} size={14} color="#94a3b8" />
        </Pressable>
      ) : null}
      <Pressable onPress={onPress} className="min-w-0 flex-1 flex-row items-center gap-1">
        {indented ? <Ionicons name="return-down-forward-outline" size={11} color="#94a3b8" /> : null}
        {category.icon ? (
          <Text className="text-xs">{category.icon}</Text>
        ) : (
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color ?? '#94a3b8' }} />
        )}
        <Text numberOfLines={1} className="flex-1 text-xs font-medium text-slate-700 dark:text-slate-200">
          {category.name}
        </Text>
      </Pressable>
      <View {...dragHandleProps} className="px-0.5 py-0.5">
        <Ionicons name="reorder-three-outline" size={14} color="#94a3b8" />
      </View>
    </View>
  );
}

type DropZone = { x: number; y: number; width: number; height: number };

export default function CategoriesScreen() {
  const { data: categories = [] } = useCategories();
  const reorderCategories = useReorderCategories();
  const updateCategory = useUpdateCategory();
  const isDesktop = useIsDesktop();
  const [editing, setEditing] = useState<Category | null | undefined>(undefined);
  const [addingGroup, setAddingGroup] = useState(false);
  const [collapsedRootIds, setCollapsedRootIds] = useState<Set<number>>(new Set());

  const toggleCollapsed = (id: number) => {
    setCollapsedRootIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 하위 카테고리를 상위 카테고리 위로 드래그해서 놓으면 소속을 바꿀 수 있게, 상위 카테고리
  // 카드들의 화면상 위치를 등록해뒀다가 드롭 시점에 그 위치와 겹치는지 확인한다.
  const rootViewRefs = useRef(new Map<number, View>());
  const dropZonesRef = useRef(new Map<number, DropZone>());

  const rootsById = useMemo(
    () => new Map(categories.filter((c) => c.parentId == null).map((c) => [c.id, c])),
    [categories],
  );
  const childrenByParentId = useMemo(() => {
    const map = new Map<number, Category[]>();
    categories
      .filter((c) => c.parentId != null)
      .forEach((c) => {
        map.set(c.parentId!, [...(map.get(c.parentId!) ?? []), c]);
      });
    map.forEach((list, parentId) => map.set(parentId, sortedCategories(list)));
    return map;
  }, [categories]);

  const expenseRoots = useMemo(
    () => sortedCategories(categories.filter((c) => c.type === 'EXPENSE' && c.parentId == null)),
    [categories],
  );
  const incomeRoots = useMemo(
    () => sortedCategories(categories.filter((c) => c.type === 'INCOME' && c.parentId == null)),
    [categories],
  );

  const handleReorder = (data: Category[]) => {
    reorderCategories.mutate(data.map((c) => c.id));
  };

  const remeasureDropZones = () => {
    rootViewRefs.current.forEach((view, id) => {
      view.measureInWindow((x, y, width, height) => {
        dropZonesRef.current.set(id, { x, y, width, height });
      });
    });
  };

  const registerRootRef = (id: number) => (ref: View | null) => {
    if (ref) {
      rootViewRefs.current.set(id, ref);
    } else {
      rootViewRefs.current.delete(id);
      dropZonesRef.current.delete(id);
    }
  };

  const tryReparent = (item: Category, pos: { x: number; y: number }) => {
    for (const [parentId, zone] of dropZonesRef.current) {
      const root = rootsById.get(parentId);
      if (!root || root.type !== item.type) continue;
      if (pos.x < zone.x || pos.x > zone.x + zone.width || pos.y < zone.y || pos.y > zone.y + zone.height) continue;

      if (parentId !== item.parentId) {
        updateCategory.mutate({
          id: item.id,
          data: {
            name: item.name,
            type: item.type,
            color: item.color ?? CATEGORY_COLOR_PALETTE[0],
            icon: item.icon,
            parentId,
            targetAmount: item.targetAmount,
            isGroup: item.isGroup,
          },
        });
      }
      return true;
    }
    return false;
  };

  const renderSection = (title: string, roots: Category[], isLast: boolean) => (
    <View className={`flex-1 gap-2 ${isLast ? '' : 'border-r border-slate-200 pr-3 dark:border-slate-700'}`}>
      <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</Text>

      {roots.length === 0 ? (
        <Text className="text-xs text-slate-400">없음</Text>
      ) : (
        <DraggableList
          items={roots}
          keyExtractor={(item) => String(item.id)}
          onReorder={handleReorder}
          renderItem={({ item: root, isDragging, dragHandleProps }) => {
            const children = childrenByParentId.get(root.id) ?? [];
            const isCollapsed = collapsedRootIds.has(root.id);
            return (
              <View className="mb-1">
                <CategoryRow
                  category={root}
                  isDragging={isDragging}
                  dragHandleProps={dragHandleProps}
                  onPress={() => setEditing(root)}
                  viewRef={registerRootRef(root.id)}
                  collapsible={children.length > 0}
                  collapsed={isCollapsed}
                  onToggleCollapse={() => toggleCollapsed(root.id)}
                />
                {children.length > 0 && !isCollapsed && (
                  <DraggableList
                    items={children}
                    keyExtractor={(item) => String(item.id)}
                    onReorder={handleReorder}
                    onDragStart={remeasureDropZones}
                    onBeforeDrop={tryReparent}
                    renderItem={({ item: child, isDragging: childDragging, dragHandleProps: childHandleProps }) => (
                      <CategoryRow
                        category={child}
                        indented
                        isDragging={childDragging}
                        dragHandleProps={childHandleProps}
                        onPress={() => setEditing(child)}
                      />
                    )}
                  />
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[900px]' : 'max-w-[480px]'}>
      <Text className="text-xs text-slate-400">
        카드의 ⋮ 아이콘을 눌러서 끌면 순서를 바꿀 수 있어요. 하위 카테고리를 상위 카테고리 위로 끌어다 놓으면 소속을
        바꿀 수 있어요.
      </Text>

      <View className="flex-row gap-3">
        {renderSection('지출', expenseRoots, false)}
        {renderSection('수입', incomeRoots, true)}
      </View>

      <View className="gap-2">
        <Pressable
          onPress={() => {
            setAddingGroup(false);
            setEditing(null);
          }}
          className="items-center rounded-xl bg-primary p-4">
          <Text className="font-semibold text-white">+ 카테고리 추가</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setAddingGroup(true);
            setEditing(null);
          }}
          className="items-center rounded-xl border border-primary p-4">
          <Text className="font-semibold text-primary">+ 상위 카테고리 추가</Text>
        </Pressable>
      </View>

      <CategoryFormModal
        visible={editing !== undefined}
        onClose={() => setEditing(undefined)}
        category={editing}
        groupOnly={editing === null && addingGroup}
      />
    </Screen>
  );
}
