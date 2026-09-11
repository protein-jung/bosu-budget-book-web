import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { DayPickerModal } from '@/components/DayPickerModal';
import { formatSignedKrw } from '@/lib/format';
import { useIsDesktop } from '@/lib/responsive';
import type { Transaction } from '@/lib/types';

import { useSearchTransactions } from './api';
import { TransactionFormModal } from './TransactionFormModal';

const DEBOUNCE_MS = 300;

function formatDateLabel(dateKey: string) {
  const [, m, d] = dateKey.split('-').map(Number);
  if (!m || !d) return dateKey;
  return `${m}월 ${d}일`;
}

export function TransactionSearchModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const isDesktop = useIsDesktop();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, visible]);

  const { data: results = [], isLoading } = useSearchTransactions(debouncedQuery, dateFilter);
  const hasCondition = debouncedQuery.trim().length > 0 || dateFilter != null;

  const handleClose = () => {
    setQuery('');
    setDebouncedQuery('');
    setDateFilter(null);
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
          <View className="gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
            <View className="flex-row items-center gap-2">
              <View className="flex-1 flex-row items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 dark:bg-slate-800">
                <Ionicons name="search" size={18} color="#94a3b8" />
                <TextInput
                  autoFocus
                  value={query}
                  onChangeText={setQuery}
                  placeholder="제목, 메모, 카테고리로 찾기"
                  placeholderTextColor="#94a3b8"
                  className="flex-1 text-base text-slate-900 dark:text-white"
                />
                {query.length > 0 ? (
                  <Pressable onPress={() => setQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color="#94a3b8" />
                  </Pressable>
                ) : null}
              </View>
              <Pressable onPress={handleClose} hitSlop={8}>
                <Text className="text-sm font-medium text-primary dark:text-secondary">닫기</Text>
              </Pressable>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setDatePickerOpen(true)}
                className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
                  dateFilter ? 'border-primary bg-primary-light' : 'border-slate-200 dark:border-slate-700'
                }`}>
                <Ionicons name="calendar-outline" size={14} color={dateFilter ? '#02007D' : '#64748b'} />
                <Text
                  className={`text-xs font-medium ${
                    dateFilter ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                  {dateFilter ? formatDateLabel(dateFilter) : '날짜'}
                </Text>
              </Pressable>
              {dateFilter ? (
                <Pressable onPress={() => setDateFilter(null)} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color="#94a3b8" />
                </Pressable>
              ) : null}
            </View>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="gap-2 p-4" keyboardShouldPersistTaps="handled">
            {!hasCondition ? (
              <Text className="py-8 text-center text-sm text-slate-400">검색어나 날짜를 선택해보세요.</Text>
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
                      {formatDateLabel(transaction.transactionDate)} · {transaction.categoryName}
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

      <DayPickerModal
        visible={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        onSelectDate={setDateFilter}
        initialDateKey={dateFilter ?? undefined}
      />

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
