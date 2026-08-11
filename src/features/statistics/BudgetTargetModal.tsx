import { useEffect, useState } from 'react';
import { Modal, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useClearMonthlyTarget, useSetMonthlyTarget } from '@/features/category/api';
import { getErrorMessage } from '@/lib/apiClient';
import { useIsDesktop } from '@/lib/responsive';
import type { CategoryBudget } from '@/lib/types';

export function BudgetTargetModal({
  visible,
  onClose,
  budget,
  year,
  month,
}: {
  visible: boolean;
  onClose: () => void;
  budget: CategoryBudget | null;
  year: number;
  month: number;
}) {
  const isDesktop = useIsDesktop();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const setMonthlyTarget = useSetMonthlyTarget();
  const clearMonthlyTarget = useClearMonthlyTarget();
  const isPending = setMonthlyTarget.isPending || clearMonthlyTarget.isPending;

  useEffect(() => {
    if (!visible || !budget) return;
    setError(null);
    setAmount(String(budget.targetAmount));
  }, [visible, budget]);

  if (!budget) return null;

  const handleSave = () => {
    setError(null);
    const numericAmount = Number(amount);
    if (!amount || numericAmount < 0) {
      setError('목표 금액을 올바르게 입력해주세요.');
      return;
    }
    setMonthlyTarget.mutate(
      { id: budget.categoryId, year, month, amount: numericAmount },
      { onSuccess: onClose, onError: (err) => setError(getErrorMessage(err, '저장에 실패했습니다.')) },
    );
  };

  const handleReset = () => {
    setError(null);
    clearMonthlyTarget.mutate(
      { id: budget.categoryId, year, month },
      { onSuccess: onClose, onError: (err) => setError(getErrorMessage(err, '되돌리기에 실패했습니다.')) },
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
            {budget.icon ? `${budget.icon} ` : ''}
            {budget.categoryName}
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            {year}년 {month}월 목표 금액
          </Text>

          <TextField
            label="목표 금액"
            value={amount}
            onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            placeholder="0"
          />

          {error ? <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text> : null}

          <View className="gap-2">
            <Button title="이번 달 목표 저장" onPress={handleSave} loading={setMonthlyTarget.isPending} />
            {budget.monthOverride ? (
              <Button
                title="기본값으로 되돌리기"
                variant="secondary"
                onPress={handleReset}
                loading={clearMonthlyTarget.isPending}
              />
            ) : null}
            <Button title="취소" variant="secondary" onPress={onClose} disabled={isPending} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
