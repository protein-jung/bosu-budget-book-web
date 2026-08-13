import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { getErrorMessage } from '@/lib/apiClient';
import { CATEGORY_COLOR_PALETTE, CATEGORY_ICON_PALETTE } from '@/lib/palette';
import { useIsDesktop } from '@/lib/responsive';
import type { Category, TransactionType } from '@/lib/types';

import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from './api';

export function CategoryFormModal({
  visible,
  onClose,
  category,
  initialType,
  onCreated,
  groupOnly,
}: {
  visible: boolean;
  onClose: () => void;
  category?: Category | null;
  initialType?: TransactionType;
  onCreated?: (category: Category) => void;
  /** true면 하위 카테고리를 묶는 상위(그룹) 카테고리 전용 모드로 연다 — 상위 카테고리 선택이
   * 빠지고 항상 최상위로 생성된다. 기존 그룹 카테고리를 수정할 때도 자동으로 이 모드가 된다. */
  groupOnly?: boolean;
}) {
  const isEdit = !!category;
  const isGroupMode = groupOnly || category?.isGroup === true;
  const isDesktop = useIsDesktop();
  const { data: categories = [] } = useCategories();
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [color, setColor] = useState(CATEGORY_COLOR_PALETTE[0]);
  const [icon, setIcon] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [parentId, setParentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const isPending = createCategory.isPending || updateCategory.isPending || deleteCategory.isPending;

  const parentOptions = useMemo(
    () =>
      categories.filter(
        (c) => c.type === type && c.parentId == null && (!category || c.id !== category.id),
      ),
    [categories, type, category],
  );

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (category) {
      setName(category.name);
      setType(category.type);
      setColor(category.color ?? CATEGORY_COLOR_PALETTE[0]);
      setIcon(category.icon ?? '');
      setTargetAmount(category.targetAmount != null ? String(category.targetAmount) : '');
      setParentId(category.parentId);
    } else {
      setName('');
      setType(initialType ?? 'EXPENSE');
      setColor(CATEGORY_COLOR_PALETTE[0]);
      setIcon('');
      setTargetAmount('');
      setParentId(null);
    }
  }, [visible, category, initialType]);

  const handleSubmit = () => {
    setError(null);
    if (!name.trim()) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }
    const payload = {
      name: name.trim(),
      type,
      color,
      icon: icon.trim() || null,
      parentId: isGroupMode ? null : parentId,
      targetAmount: targetAmount.trim() ? Number(targetAmount) : null,
      isGroup: isGroupMode,
    };
    if (isEdit && category) {
      updateCategory.mutate(
        { id: category.id, data: payload },
        { onSuccess: onClose, onError: (err) => setError(getErrorMessage(err, '수정에 실패했습니다.')) },
      );
    } else {
      createCategory.mutate(payload, {
        onSuccess: (created) => {
          onCreated?.(created);
          onClose();
        },
        onError: (err) => setError(getErrorMessage(err, '추가에 실패했습니다.')),
      });
    }
  };

  const handleDelete = () => {
    if (!category) return;
    deleteCategory.mutate(category.id, {
      onSuccess: onClose,
      onError: (err) => setError(getErrorMessage(err, '삭제에 실패했습니다.')),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className={`flex-1 bg-black/40 ${isDesktop ? 'items-center justify-center' : 'justify-end'}`}>
        <View
          className={`max-h-[85%] gap-4 bg-white p-5 dark:bg-slate-900 ${
            isDesktop ? 'w-full max-w-[560px] rounded-3xl' : 'rounded-t-3xl'
          }`}>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            {isGroupMode
              ? isEdit
                ? '상위 카테고리 수정'
                : '상위 카테고리 추가'
              : isEdit
                ? '카테고리 수정'
                : '카테고리 추가'}
          </Text>
          {!isEdit && isGroupMode ? (
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              하위 카테고리를 묶는 상위 카테고리예요. 거래 입력할 때는 선택할 수 없어요.
            </Text>
          ) : null}

          <ScrollView className="max-h-[60%]" keyboardShouldPersistTaps="handled">
            <View className="gap-4">
              <View className="flex-row gap-2">
                <Chip
                  label="지출"
                  selected={type === 'EXPENSE'}
                  onPress={() => {
                    setType('EXPENSE');
                    setParentId(null);
                  }}
                />
                <Chip
                  label="수입"
                  selected={type === 'INCOME'}
                  onPress={() => {
                    setType('INCOME');
                    setParentId(null);
                  }}
                />
              </View>

              <TextField label="이름" value={name} onChangeText={setName} placeholder="예) 외식비" />

              {isGroupMode ? null : (
                <View className="gap-2">
                  <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">상위 카테고리</Text>
                  <View className="flex-row flex-wrap gap-2">
                    <Chip label="없음 (대분류)" selected={parentId == null} onPress={() => setParentId(null)} />
                    {parentOptions.map((parent) => (
                      <Chip
                        key={parent.id}
                        label={parent.name}
                        icon={parent.icon}
                        selected={parentId === parent.id}
                        onPress={() => setParentId(parent.id)}
                      />
                    ))}
                  </View>
                </View>
              )}

              <View className="gap-2">
                <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">색상</Text>
                <View className="flex-row flex-wrap gap-2">
                  {CATEGORY_COLOR_PALETTE.map((swatch) => (
                    <Pressable
                      key={swatch}
                      onPress={() => setColor(swatch)}
                      style={{ backgroundColor: swatch }}
                      className={`h-9 w-9 rounded-full ${color === swatch ? 'border-4 border-slate-900 dark:border-white' : ''}`}
                    />
                  ))}
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">아이콘 (선택)</Text>
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-cream dark:bg-slate-800">
                    <Text className="text-xl">{icon || '🙂'}</Text>
                  </View>
                  <TextInput
                    value={icon}
                    onChangeText={setIcon}
                    placeholder="이모지를 입력하거나 아래에서 선택"
                    placeholderTextColor="#94a3b8"
                    maxLength={8}
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                  {icon ? (
                    <Pressable onPress={() => setIcon('')} className="px-2 py-2">
                      <Text className="text-sm text-slate-400">지우기</Text>
                    </Pressable>
                  ) : null}
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {CATEGORY_ICON_PALETTE.map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => setIcon(emoji)}
                      className={`h-10 w-10 items-center justify-center rounded-full ${
                        icon === emoji
                          ? 'border-2 border-primary bg-primary-light dark:bg-slate-700'
                          : 'bg-cream dark:bg-slate-800'
                      }`}>
                      <Text className="text-base">{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <TextField
                label="월 목표 금액 (선택)"
                value={targetAmount}
                onChangeText={(text) => setTargetAmount(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="예) 200000"
              />
            </View>
          </ScrollView>

          {error ? <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text> : null}

          <View className="gap-2">
            <Button title={isEdit ? '수정하기' : '추가하기'} onPress={handleSubmit} loading={isPending} />
            {isEdit ? <Button title="삭제하기" variant="danger" onPress={handleDelete} loading={isPending} /> : null}
            <Button title="취소" variant="secondary" onPress={onClose} disabled={isPending} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
