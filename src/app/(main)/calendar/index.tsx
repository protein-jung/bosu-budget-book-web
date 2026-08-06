import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { CalendarGrid } from '@/components/CalendarGrid';
import { Screen } from '@/components/Screen';
import { useMonthlyTransactions } from '@/features/transaction/api';
import { TransactionFormModal } from '@/features/transaction/TransactionFormModal';
import { addMonths, formatMonthLabel, toDateKey } from '@/lib/calendar';
import { formatSignedKrw } from '@/lib/format';
import type { Transaction } from '@/lib/types';

export default function CalendarScreen() {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(today));
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { data: transactions = [], isLoading } = useMonthlyTransactions(year, month);

  const summaries = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    for (const transaction of transactions) {
      const entry = map[transaction.transactionDate] ?? { income: 0, expense: 0 };
      if (transaction.type === 'INCOME') entry.income += transaction.amount;
      else entry.expense += transaction.amount;
      map[transaction.transactionDate] = entry;
    }
    return map;
  }, [transactions]);

  const dayTransactions = transactions.filter((t) => t.transactionDate === selectedDateKey);

  const changeMonth = (delta: number) => {
    const next = addMonths(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  const openCreate = () => {
    setEditingTransaction(null);
    setModalVisible(true);
  };

  const openEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setModalVisible(true);
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => changeMonth(-1)} className="px-3 py-2">
          <Text className="text-xl text-slate-600 dark:text-slate-300">‹</Text>
        </Pressable>
        <Text className="text-lg font-bold text-slate-900 dark:text-white">{formatMonthLabel(year, month)}</Text>
        <Pressable onPress={() => changeMonth(1)} className="px-3 py-2">
          <Text className="text-xl text-slate-600 dark:text-slate-300">›</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <CalendarGrid
          year={year}
          month={month}
          summaries={summaries}
          selectedDateKey={selectedDateKey}
          onSelectDate={setSelectedDateKey}
        />
      )}

      <View className="flex-row items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
        <Text className="text-base font-semibold text-slate-900 dark:text-white">{selectedDateKey}</Text>
        <Pressable onPress={openCreate} className="rounded-full bg-blue-600 px-4 py-2">
          <Text className="font-semibold text-white">+ 추가</Text>
        </Pressable>
      </View>

      <View className="gap-2">
        {dayTransactions.length === 0 ? (
          <Text className="py-4 text-center text-slate-400">등록된 내역이 없습니다.</Text>
        ) : (
          dayTransactions.map((transaction) => (
            <Pressable
              key={transaction.id}
              onPress={() => openEdit(transaction)}
              className="flex-row items-center justify-between rounded-xl bg-white p-4 dark:bg-slate-900">
              <View className="flex-1 gap-0.5">
                <Text className="font-medium text-slate-900 dark:text-white">{transaction.categoryName}</Text>
                <Text className="text-xs text-slate-400">
                  {transaction.userName}
                  {transaction.cardName ? ` · ${transaction.cardName}` : ''}
                  {transaction.memo ? ` · ${transaction.memo}` : ''}
                </Text>
              </View>
              <Text
                className={`font-semibold ${
                  transaction.type === 'INCOME' ? 'text-emerald-600' : 'text-red-500'
                }`}>
                {formatSignedKrw(transaction.amount, transaction.type)}
              </Text>
            </Pressable>
          ))
        )}
      </View>

      <TransactionFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        dateKey={selectedDateKey}
        transaction={editingTransaction}
      />
    </Screen>
  );
}
