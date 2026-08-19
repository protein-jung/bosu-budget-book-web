import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { AmountField } from '@/components/AmountField';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { useCategories } from '@/features/category/api';
import { getErrorMessage } from '@/lib/apiClient';
import { useIsDesktop } from '@/lib/responsive';
import type { Category, RecurringExpense } from '@/lib/types';
import { toast } from '@/store/toastStore';

import { useCreateRecurringExpense, useDeleteRecurringExpense, useUpdateRecurringExpense } from './api';

/** 하위가 있는 대분류(그룹)는 숨기고 실제로 거래를 붙일 수 있는 소분류만 선택지로 보여준다. */
function selectableExpenseCategories(categories: Category[], selectedId: number | null): Category[] {
  const expenses = categories.filter((c) => c.type === 'EXPENSE');
  const parentIdsWithChildren = new Set(
    expenses.filter((c) => c.parentId != null).map((c) => c.parentId as number),
  );
  return expenses.filter((c) => (!parentIdsWithChildren.has(c.id) && !c.isGroup) || c.id === selectedId);
}

export function RecurringExpenseFormModal({
  visible,
  onClose,
  recurringExpense,
}: {
  visible: boolean;
  onClose: () => void;
  recurringExpense?: RecurringExpense | null;
}) {
  const isEdit = !!recurringExpense;
  const isDesktop = useIsDesktop();
  const { data: categories = [] } = useCategories();

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [active, setActive] = useState(true);
  const [memo, setMemo] = useState('');

  const createRecurringExpense = useCreateRecurringExpense();
  const updateRecurringExpense = useUpdateRecurringExpense();
  const deleteRecurringExpense = useDeleteRecurringExpense();
  const isPending =
    createRecurringExpense.isPending || updateRecurringExpense.isPending || deleteRecurringExpense.isPending;

  useEffect(() => {
    if (!visible) return;
    if (recurringExpense) {
      setCategoryId(recurringExpense.categoryId);
      setName(recurringExpense.name);
      setAmount(String(recurringExpense.amount));
      setDayOfMonth(String(recurringExpense.dayOfMonth));
      setActive(recurringExpense.active);
      setMemo(recurringExpense.memo ?? '');
    } else {
      setCategoryId(null);
      setName('');
      setAmount('');
      setDayOfMonth('1');
      setActive(true);
      setMemo('');
    }
  }, [visible, recurringExpense]);

  const filteredCategories = useMemo(
    () => selectableExpenseCategories(categories, categoryId),
    [categories, categoryId],
  );
  const parentNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of categories) {
      if (c.parentId == null) map.set(c.id, c.name);
    }
    return map;
  }, [categories]);

  const handleSubmit = () => {
    const numericAmount = Number(amount);
    const numericDay = Number(dayOfMonth);
    if (!name.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    if (!categoryId) {
      toast.error('카테고리를 선택해주세요.');
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      toast.error('금액을 올바르게 입력해주세요.');
      return;
    }
    if (!Number.isInteger(numericDay) || numericDay < 1 || numericDay > 31) {
      toast.error('매달 며칠에 추가할지 1~31 사이로 입력해주세요.');
      return;
    }

    const payload = {
      categoryId,
      name: name.trim(),
      amount: numericAmount,
      dayOfMonth: numericDay,
      active,
      memo: memo.trim() || null,
    };

    if (isEdit && recurringExpense) {
      updateRecurringExpense.mutate(
        { id: recurringExpense.id, data: payload },
        {
          onSuccess: () => {
            toast.success('고정비를 수정했어요.');
            onClose();
          },
          onError: (err) => toast.error(getErrorMessage(err, '수정에 실패했습니다.')),
        },
      );
    } else {
      createRecurringExpense.mutate(payload, {
        onSuccess: () => {
          toast.success('고정비를 추가했어요.');
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err, '추가에 실패했습니다.')),
      });
    }
  };

  const handleDelete = () => {
    if (!recurringExpense) return;
    deleteRecurringExpense.mutate(recurringExpense.id, {
      onSuccess: () => {
        toast.success('고정비를 삭제했어요.');
        onClose();
      },
      onError: (err) => toast.error(getErrorMessage(err, '삭제에 실패했습니다.')),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className={`flex-1 bg-black/40 ${isDesktop ? 'items-center justify-center' : 'justify-end'}`}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className={`max-h-[85%] bg-white p-5 dark:bg-slate-900 ${
            isDesktop ? 'w-full max-w-[560px] rounded-3xl' : 'rounded-t-3xl'
          }`}>
          <ScrollView contentContainerClassName="gap-4" showsVerticalScrollIndicator={false}>
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              {isEdit ? '고정비 수정' : '고정비 추가'}
            </Text>

            <TextField label="이름" value={name} onChangeText={setName} placeholder="예) 넷플릭스, 월세" />

            <View className="gap-2">
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">카테고리</Text>
              <View className="flex-row flex-wrap gap-2">
                {filteredCategories.map((category) => {
                  const parentName = category.parentId != null ? parentNameById.get(category.parentId) : null;
                  const label = parentName ? `${parentName} · ${category.name}` : category.name;
                  return (
                    <Chip
                      key={category.id}
                      label={label}
                      color={category.color}
                      icon={category.icon}
                      selected={categoryId === category.id}
                      onPress={() => setCategoryId(category.id)}
                    />
                  );
                })}
              </View>
            </View>

            <AmountField label="금액" value={amount} onChangeText={setAmount} />

            <TextField
              label="매달 며칠에 추가할까요?"
              value={dayOfMonth}
              onChangeText={(text) => setDayOfMonth(text.replace(/[^0-9]/g, '').slice(0, 2))}
              keyboardType="numeric"
              placeholder="1~31"
            />
            <Text className="-mt-2.5 text-xs text-slate-400">
              31일처럼 그 달에 없는 날짜를 입력하면 말일에 추가돼요.
            </Text>

            <TextField label="메모 (선택)" value={memo} onChangeText={setMemo} placeholder="메모를 입력하세요" />

            <View className="gap-2">
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">자동 추가</Text>
              <View className="flex-row gap-2">
                <Chip label="끔" selected={!active} onPress={() => setActive(false)} />
                <Chip label="켬" selected={active} onPress={() => setActive(true)} />
              </View>
            </View>

            <View className="gap-2">
              <Button title={isEdit ? '수정하기' : '추가하기'} onPress={handleSubmit} loading={isPending} />
              {isEdit ? (
                <Button title="삭제하기" variant="danger" onPress={handleDelete} loading={isPending} />
              ) : null}
              <Button title="취소" variant="secondary" onPress={onClose} disabled={isPending} />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
