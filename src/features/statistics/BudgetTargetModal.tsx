import { useEffect, useState } from 'react';
import { Modal, Text, View } from 'react-native';

import { AmountField } from '@/components/AmountField';
import { Button } from '@/components/Button';
import { useUpdateCategory } from '@/features/category/api';
import { getErrorMessage } from '@/lib/apiClient';
import { CATEGORY_COLOR_PALETTE } from '@/lib/palette';
import { useIsDesktop } from '@/lib/responsive';
import type { Category } from '@/lib/types';
import { toast } from '@/store/toastStore';

export function BudgetTargetModal({
  visible,
  onClose,
  category,
}: {
  visible: boolean;
  onClose: () => void;
  category: Category | null;
}) {
  const isDesktop = useIsDesktop();
  const [amount, setAmount] = useState('');

  const updateCategory = useUpdateCategory();

  useEffect(() => {
    if (!visible || !category) return;
    setAmount(category.targetAmount != null ? String(category.targetAmount) : '');
  }, [visible, category]);

  if (!category) return null;

  const handleSave = () => {
    const numericAmount = Number(amount);
    if (!amount || numericAmount < 0) {
      toast.error('목표 금액을 올바르게 입력해주세요.');
      return;
    }
    updateCategory.mutate(
      {
        id: category.id,
        data: {
          name: category.name,
          type: category.type,
          color: category.color ?? CATEGORY_COLOR_PALETTE[0],
          icon: category.icon,
          parentId: category.parentId,
          targetAmount: numericAmount,
          isGroup: category.isGroup,
        },
      },
      {
        onSuccess: () => {
          toast.success('목표 금액을 저장했어요.');
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err, '저장에 실패했습니다.')),
      },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className={`flex-1 bg-black/40 ${isDesktop ? 'items-center justify-center' : 'justify-end'}`}>
        <View
          className={`gap-4 bg-white p-5 dark:bg-slate-900 ${
            isDesktop ? 'w-full max-w-[560px] rounded-3xl' : 'rounded-t-3xl'
          }`}>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            {category.icon ? `${category.icon} ` : ''}
            {category.name}
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">월 목표 금액</Text>

          <AmountField label="목표 금액" value={amount} onChangeText={setAmount} />

          <View className="gap-2">
            <Button title="저장" onPress={handleSave} loading={updateCategory.isPending} />
            <Button title="취소" variant="secondary" onPress={onClose} disabled={updateCategory.isPending} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
