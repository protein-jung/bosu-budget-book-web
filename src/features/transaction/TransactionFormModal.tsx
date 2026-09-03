import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { AmountField } from '@/components/AmountField';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { useCards } from '@/features/card/api';
import { useCategories } from '@/features/category/api';
import { CategoryFormModal } from '@/features/category/CategoryFormModal';
import { getErrorMessage } from '@/lib/apiClient';
import { topLevelCategories } from '@/lib/categoryTree';
import { useIsDesktop } from '@/lib/responsive';
import type { Category, Transaction, TransactionType } from '@/lib/types';
import { toast } from '@/store/toastStore';

import { useCreateTransaction, useDeleteTransaction, useUpdateTransaction } from './api';

type TransactionFormModalProps = {
  visible: boolean;
  onClose: () => void;
  dateKey: string;
  transaction?: Transaction | null;
  initialType?: TransactionType;
  /** 목록 화면 위에서 이 모달을 열었을 때만 전달 — 저장/취소 없이 이전 목록으로 돌아가는 뒤로가기 버튼을 보여준다. */
  onBack?: () => void;
};

export function TransactionFormModal({
  visible,
  onClose,
  dateKey,
  transaction,
  initialType,
  onBack,
}: TransactionFormModalProps) {
  const isEdit = !!transaction;
  const isDesktop = useIsDesktop();
  const { data: categories = [] } = useCategories();
  const { data: cards = [] } = useCards();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  /** 지금 펼쳐서 보고 있는 대분류. 소분류가 없는(=단독) 대분류를 고르면 categoryId도 곧바로
   * 같이 정해진다. */
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [cardId, setCardId] = useState<number | null>(null);
  const [memo, setMemo] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  useEffect(() => {
    if (!visible) return;
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setCategoryId(transaction.categoryId);
      const category = categories.find((c) => c.id === transaction.categoryId);
      setActiveGroupId(category?.parentId ?? transaction.categoryId);
      setCardId(transaction.cardId);
      setMemo(transaction.memo ?? '');
    } else {
      setType(initialType ?? 'EXPENSE');
      setAmount('');
      setCategoryId(null);
      setActiveGroupId(null);
      setCardId(null);
      setMemo('');
    }
  }, [visible, transaction, initialType, categories]);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    setCategoryId(null);
    setActiveGroupId(null);
  };

  const topGroups = useMemo(() => topLevelCategories(categories, type), [categories, type]);
  const activeChildren = useMemo(
    () => (activeGroupId == null ? [] : categories.filter((c) => c.type === type && c.parentId === activeGroupId)),
    [categories, type, activeGroupId],
  );

  const handleSelectGroup = (group: Category) => {
    setActiveGroupId(group.id);
    const children = categories.filter((c) => c.parentId === group.id);
    if (children.length === 0) {
      // 하위 카테고리가 없는 단독 대분류 — 이 자체가 최종 선택.
      setCategoryId(group.id);
    } else if (!children.some((c) => c.id === categoryId)) {
      // 지금 선택돼 있던 소분류가 새로 고른 대분류 소속이 아니면 다시 고르게 비운다.
      setCategoryId(null);
    }
  };

  const isPending = createTransaction.isPending || updateTransaction.isPending || deleteTransaction.isPending;
  // 목록 위에서 열린 경우엔 저장/삭제/취소 모두 그 목록으로 돌아가는 게 자연스럽다.
  const finish = onBack ?? onClose;

  const handleSubmit = () => {
    const title = memo.trim();
    if (!title) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      toast.error('금액을 올바르게 입력해주세요.');
      return;
    }
    if (!categoryId) {
      toast.error('카테고리를 선택해주세요.');
      return;
    }
    const payload = {
      type,
      amount: numericAmount,
      transactionDate: dateKey,
      categoryId,
      cardId,
      memo: title,
    };

    if (isEdit && transaction) {
      updateTransaction.mutate(
        { id: transaction.id, data: payload },
        {
          onSuccess: () => {
            toast.success('내역을 수정했어요.');
            finish();
          },
          onError: (err) => toast.error(getErrorMessage(err, '수정에 실패했습니다.')),
        },
      );
    } else {
      createTransaction.mutate(payload, {
        onSuccess: () => {
          toast.success('내역을 추가했어요.');
          finish();
        },
        onError: (err) => toast.error(getErrorMessage(err, '등록에 실패했습니다.')),
      });
    }
  };

  const handleDelete = () => {
    if (!transaction) return;
    deleteTransaction.mutate(transaction.id, {
      onSuccess: () => {
        toast.success('내역을 삭제했어요.');
        finish();
      },
      onError: (err) => toast.error(getErrorMessage(err, '삭제에 실패했습니다.')),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={finish}>
      <Pressable
        onPress={finish}
        className={`flex-1 bg-black/40 ${isDesktop ? 'items-center justify-center' : 'justify-end'}`}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className={`max-h-[85%] bg-white p-5 dark:bg-slate-900 ${
            isDesktop ? 'w-full max-w-[560px] rounded-3xl' : 'rounded-t-3xl'
          }`}>
          <ScrollView contentContainerClassName="gap-4" showsVerticalScrollIndicator={false}>
            {onBack ? (
              <Pressable onPress={onBack} hitSlop={8} className="flex-row items-center gap-1 self-start">
                <Ionicons name="chevron-back" size={18} color="#64748b" />
                <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">뒤로</Text>
              </Pressable>
            ) : null}
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              {dateKey} {isEdit ? '내역 수정' : '내역 추가'}
            </Text>

            <TextField label="제목" value={memo} onChangeText={setMemo} placeholder="예) 스타벅스 강남점" />

            <View className="flex-row gap-2">
              <Chip label="지출" selected={type === 'EXPENSE'} onPress={() => handleTypeChange('EXPENSE')} />
              <Chip label="수입" selected={type === 'INCOME'} onPress={() => handleTypeChange('INCOME')} />
            </View>

            <AmountField label="금액" value={amount} onChangeText={setAmount} />

            <View className="gap-2">
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">대분류</Text>
              <View className="flex-row flex-wrap gap-2">
                {topGroups.map((group) => (
                  <Chip
                    key={group.id}
                    label={group.name}
                    color={group.color}
                    icon={group.icon}
                    selected={activeGroupId === group.id}
                    onPress={() => handleSelectGroup(group)}
                  />
                ))}
              </View>
            </View>

            {activeChildren.length > 0 ? (
              <View className="gap-2">
                <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">소분류</Text>
                <View className="flex-row flex-wrap gap-2">
                  {activeChildren.map((category) => (
                    <Chip
                      key={category.id}
                      label={category.name}
                      color={category.color}
                      icon={category.icon}
                      selected={categoryId === category.id}
                      onPress={() => setCategoryId(category.id)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <Pressable
              onPress={() => setAddingCategory(true)}
              className="flex-row items-center self-start gap-1.5 rounded-full border border-dashed border-primary px-3.5 py-2">
              <Text className="text-sm font-medium text-primary">+ 카테고리 추가</Text>
            </Pressable>

            <View className="gap-2">
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">카드 (선택)</Text>
              <View className="flex-row flex-wrap gap-2">
                <Chip label="없음" selected={cardId === null} onPress={() => setCardId(null)} />
                {cards.map((card) => (
                  <Chip key={card.id} label={card.name} selected={cardId === card.id} onPress={() => setCardId(card.id)} />
                ))}
              </View>
            </View>

            <View className="gap-2">
              <Button title={isEdit ? '수정하기' : '추가하기'} onPress={handleSubmit} loading={isPending} />
              {isEdit ? (
                <Button title="삭제하기" variant="danger" onPress={handleDelete} loading={isPending} />
              ) : null}
              <Button title="취소" variant="secondary" onPress={finish} disabled={isPending} />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>

      <CategoryFormModal
        visible={addingCategory}
        onClose={() => setAddingCategory(false)}
        category={null}
        initialType={type}
        onCreated={(created) => {
          setCategoryId(created.id);
          setActiveGroupId(created.parentId ?? created.id);
        }}
      />
    </Modal>
  );
}
