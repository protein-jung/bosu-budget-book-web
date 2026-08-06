import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { getErrorMessage } from '@/lib/apiClient';
import { CATEGORY_COLOR_PALETTE } from '@/lib/palette';
import type { Category, TransactionType } from '@/lib/types';

import { useCreateCategory, useDeleteCategory, useUpdateCategory } from './api';

export function CategoryFormModal({
  visible,
  onClose,
  category,
}: {
  visible: boolean;
  onClose: () => void;
  category?: Category | null;
}) {
  const isEdit = !!category;
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [color, setColor] = useState(CATEGORY_COLOR_PALETTE[0]);
  const [error, setError] = useState<string | null>(null);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const isPending = createCategory.isPending || updateCategory.isPending || deleteCategory.isPending;

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (category) {
      setName(category.name);
      setType(category.type);
      setColor(category.color ?? CATEGORY_COLOR_PALETTE[0]);
    } else {
      setName('');
      setType('EXPENSE');
      setColor(CATEGORY_COLOR_PALETTE[0]);
    }
  }, [visible, category]);

  const handleSubmit = () => {
    setError(null);
    if (!name.trim()) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }
    const payload = { name: name.trim(), type, color };
    if (isEdit && category) {
      updateCategory.mutate(
        { id: category.id, data: payload },
        { onSuccess: onClose, onError: (err) => setError(getErrorMessage(err, '수정에 실패했습니다.')) },
      );
    } else {
      createCategory.mutate(payload, {
        onSuccess: onClose,
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
      <View className="flex-1 justify-end bg-black/40">
        <View className="gap-4 rounded-t-3xl bg-white p-5 dark:bg-slate-900">
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            {isEdit ? '카테고리 수정' : '카테고리 추가'}
          </Text>

          <View className="flex-row gap-2">
            <Chip label="지출" selected={type === 'EXPENSE'} onPress={() => setType('EXPENSE')} />
            <Chip label="수입" selected={type === 'INCOME'} onPress={() => setType('INCOME')} />
          </View>

          <TextField label="이름" value={name} onChangeText={setName} placeholder="예) 식비" />

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
