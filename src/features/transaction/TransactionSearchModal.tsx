import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useIsDesktop } from '@/lib/responsive';
import { formatSignedKrw } from '@/lib/format';
import type { Transaction } from '@/lib/types';

import { useSearchTransactions } from './api';
import { TransactionFormModal } from './TransactionFormModal';

const DEBOUNCE_MS = 300;

function formatDateShort(dateKey: string) {
  const [, m, d] = dateKey.split('-').map(Number);
  if (!m || !d) return dateKey;
  return `${m}.${d}`;
}

export function TransactionSearchModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const isDesktop = useIsDesktop();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, visible]);

  const { data: results = [], isLoading } = useSearchTransactions(debouncedQuery);

  const handleClose = () => {
    setQuery('');
    setDebouncedQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable
        onPress={handleClose}
        className={`flex-1 bg-black/40 ${isDesktop ? 'items-center justify-center' : 'justify-end'}`}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className={`max-h-[85%] overflow-hidden bg-white dark:bg-slate-900 ${
            isDesktop ? 'w-full max-w-[480px] rounded-3xl' : 'h-[85%] rounded-t-3xl'
          }`}>
          <View className="flex-row items-center gap-2 border-b border-slate-100 p-4 dark:border-slate-800">
            <Ionicons name="search" size={18} color="#94a3b8" />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="제목, 메모, 카테고리로 찾기"
              placeholderTextColor="#94a3b8"
              className="flex-1 text-base text-slate-900 dark:text-white"
            />
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={22} color="#64748b" />
            </Pressable>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="gap-2 p-4" keyboardShouldPersistTaps="handled">
            {debouncedQuery.trim().length === 0 ? (
              <Text className="py-8 text-center text-sm text-slate-400">검색어를 입력해보세요.</Text>
            ) : isLoading ? (
              <ActivityIndicator className="py-8" />
            ) : results.length === 0 ? (
              <Text className="py-8 text-center text-sm text-slate-400">일치하는 내역이 없어요.</Text>
            ) : (
              results.map((transaction) => (
                <Pressable
                  key={transaction.id}
                  onPress={() => setEditingTransaction(transaction)}
                  className="flex-row items-center justify-between gap-2 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800">
                  <View className="flex-1 gap-0.5">
                    <Text className="font-medium text-slate-900 dark:text-white" numberOfLines={1}>
                      {transaction.categoryIcon ? `${transaction.categoryIcon} ` : ''}
                      {transaction.memo || transaction.categoryName}
                    </Text>
                    <Text className="text-xs text-slate-400" numberOfLines={1}>
                      {formatDateShort(transaction.transactionDate)} · {transaction.categoryName}
                      {transaction.note ? ` · ${transaction.note}` : ''}
                    </Text>
                  </View>
                  <Text
                    className={`font-semibold ${transaction.type === 'INCOME' ? 'text-primary' : 'text-secondary'}`}>
                    {formatSignedKrw(transaction.amount, transaction.type)}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>

      <TransactionFormModal
        visible={editingTransaction !== null}
        onClose={() => setEditingTransaction(null)}
        onBack={() => setEditingTransaction(null)}
        dateKey={editingTransaction?.transactionDate ?? ''}
        transaction={editingTransaction}
      />
    </Modal>
  );
}
