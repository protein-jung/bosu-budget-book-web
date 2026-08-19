import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useClearCategoryMemo, useSetCategoryMemo } from '@/features/category/api';
import { getErrorMessage } from '@/lib/apiClient';
import { useIsDesktop } from '@/lib/responsive';
import { toast } from '@/store/toastStore';

export type MemoTarget = {
  categoryId: number;
  categoryName: string;
  icon: string | null;
  year: number;
  month: number;
  memo: string | null;
};

export function CategoryMemoModal({
  visible,
  onClose,
  target,
}: {
  visible: boolean;
  onClose: () => void;
  target: MemoTarget | null;
}) {
  const isDesktop = useIsDesktop();
  const [memo, setMemo] = useState('');

  const setCategoryMemo = useSetCategoryMemo();
  const clearCategoryMemo = useClearCategoryMemo();
  const isPending = setCategoryMemo.isPending || clearCategoryMemo.isPending;

  useEffect(() => {
    if (!visible || !target) return;
    setMemo(target.memo ?? '');
  }, [visible, target]);

  if (!target) return null;

  const handleSave = () => {
    if (!memo.trim()) {
      toast.error('메모를 입력해주세요.');
      return;
    }
    setCategoryMemo.mutate(
      { id: target.categoryId, year: target.year, month: target.month, memo: memo.trim() },
      {
        onSuccess: () => {
          toast.success('메모를 저장했어요.');
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err, '저장에 실패했습니다.')),
      },
    );
  };

  const handleDelete = () => {
    clearCategoryMemo.mutate(
      { id: target.categoryId, year: target.year, month: target.month },
      {
        onSuccess: () => {
          toast.success('메모를 삭제했어요.');
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err, '삭제에 실패했습니다.')),
      },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className={`flex-1 bg-black/40 ${isDesktop ? 'items-center justify-center' : 'justify-end'}`}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className={`gap-4 bg-white p-5 dark:bg-slate-900 ${
            isDesktop ? 'w-full max-w-[560px] rounded-3xl' : 'rounded-t-3xl'
          }`}>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            {target.icon ? `${target.icon} ` : ''}
            {target.categoryName}
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            {target.year}년 {target.month}월 메모
          </Text>

          <TextField
            label="메모"
            value={memo}
            onChangeText={setMemo}
            placeholder="이 달의 이 카테고리에 대해 남길 메모를 입력하세요"
            multiline
            numberOfLines={4}
          />

          <View className="gap-2">
            <Button title="저장" onPress={handleSave} loading={setCategoryMemo.isPending} />
            {target.memo != null ? (
              <Button title="삭제" variant="danger" onPress={handleDelete} loading={clearCategoryMemo.isPending} />
            ) : null}
            <Button title="취소" variant="secondary" onPress={onClose} disabled={isPending} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
