import { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { useCards } from '@/features/card/api';
import { useCategories } from '@/features/category/api';
import { getErrorMessage } from '@/lib/apiClient';
import type { Transaction, TransactionType } from '@/lib/types';

import { useCreateTransaction, useDeleteTransaction, useUpdateTransaction } from './api';

type TransactionFormModalProps = {
  visible: boolean;
  onClose: () => void;
  dateKey: string;
  transaction?: Transaction | null;
};

export function TransactionFormModal({ visible, onClose, dateKey, transaction }: TransactionFormModalProps) {
  const isEdit = !!transaction;
  const { data: categories = [] } = useCategories();
  const { data: cards = [] } = useCards();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cardId, setCardId] = useState<number | null>(null);
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setCategoryId(transaction.categoryId);
      setCardId(transaction.cardId);
      setMemo(transaction.memo ?? '');
    } else {
      setType('EXPENSE');
      setAmount('');
      setCategoryId(null);
      setCardId(null);
      setMemo('');
    }
  }, [visible, transaction]);

  const filteredCategories = categories.filter((category) => category.type === type);
  const isPending = createTransaction.isPending || updateTransaction.isPending || deleteTransaction.isPending;

  const handleSubmit = () => {
    setError(null);
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('금액을 올바르게 입력해주세요.');
      return;
    }
    if (!categoryId) {
      setError('카테고리를 선택해주세요.');
      return;
    }
    const payload = {
      type,
      amount: numericAmount,
      transactionDate: dateKey,
      categoryId,
      cardId,
      memo: memo.trim() || null,
    };

    if (isEdit && transaction) {
      updateTransaction.mutate(
        { id: transaction.id, data: payload },
        { onSuccess: onClose, onError: (err) => setError(getErrorMessage(err, '수정에 실패했습니다.')) },
      );
    } else {
      createTransaction.mutate(payload, {
        onSuccess: onClose,
        onError: (err) => setError(getErrorMessage(err, '등록에 실패했습니다.')),
      });
    }
  };

  const handleDelete = () => {
    if (!transaction) return;
    deleteTransaction.mutate(transaction.id, {
      onSuccess: onClose,
      onError: (err) => setError(getErrorMessage(err, '삭제에 실패했습니다.')),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[85%] rounded-t-3xl bg-white p-5 dark:bg-slate-900">
          <ScrollView contentContainerClassName="gap-4" showsVerticalScrollIndicator={false}>
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              {dateKey} {isEdit ? '내역 수정' : '내역 추가'}
            </Text>

            <View className="flex-row gap-2">
              <Chip label="지출" selected={type === 'EXPENSE'} onPress={() => setType('EXPENSE')} />
              <Chip label="수입" selected={type === 'INCOME'} onPress={() => setType('INCOME')} />
            </View>

            <TextField
              label="금액"
              value={amount}
              onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="0"
            />

            <View className="gap-2">
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">카테고리</Text>
              <View className="flex-row flex-wrap gap-2">
                {filteredCategories.length === 0 ? (
                  <Text className="text-sm text-slate-400">설정에서 카테고리를 먼저 추가해주세요.</Text>
                ) : (
                  filteredCategories.map((category) => (
                    <Chip
                      key={category.id}
                      label={category.name}
                      color={category.color}
                      selected={categoryId === category.id}
                      onPress={() => setCategoryId(category.id)}
                    />
                  ))
                )}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">카드 (선택)</Text>
              <View className="flex-row flex-wrap gap-2">
                <Chip label="없음" selected={cardId === null} onPress={() => setCardId(null)} />
                {cards.map((card) => (
                  <Chip key={card.id} label={card.name} selected={cardId === card.id} onPress={() => setCardId(card.id)} />
                ))}
              </View>
            </View>

            <TextField label="메모 (선택)" value={memo} onChangeText={setMemo} placeholder="메모를 입력하세요" />

            {error ? <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text> : null}

            <View className="gap-2">
              <Button title={isEdit ? '수정하기' : '추가하기'} onPress={handleSubmit} loading={isPending} />
              {isEdit ? (
                <Button title="삭제하기" variant="danger" onPress={handleDelete} loading={isPending} />
              ) : null}
              <Button title="취소" variant="secondary" onPress={onClose} disabled={isPending} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
