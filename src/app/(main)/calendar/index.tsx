import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { CalendarGrid } from '@/components/CalendarGrid';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { useCategories } from '@/features/category/api';
import { CategoryFormModal } from '@/features/category/CategoryFormModal';
import { useMonthlyTransactions, useUpdateTransaction } from '@/features/transaction/api';
import { MonthSummaryPanel } from '@/features/statistics/MonthSummaryPanel';
import { TransactionFormModal } from '@/features/transaction/TransactionFormModal';
import { addMonths, formatMonthLabel, toDateKey } from '@/lib/calendar';
import { formatSignedKrw } from '@/lib/format';
import { useIsDesktop } from '@/lib/responsive';
import type { Transaction, TransactionType } from '@/lib/types';

const UNCATEGORIZED_NAME = '미분류';

export default function CalendarScreen() {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(today));
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [createType, setCreateType] = useState<TransactionType>('EXPENSE');
  const [addingCategoryType, setAddingCategoryType] = useState<TransactionType | null>(null);

  const isDesktop = useIsDesktop();
  const { data: transactions = [], isLoading } = useMonthlyTransactions(year, month);
  const { data: allCategories = [] } = useCategories();
  const updateTransaction = useUpdateTransaction();

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

  const monthCategories = useMemo(() => {
    const map = new Map<number, { id: number; name: string; color: string | null; icon: string | null }>();
    for (const t of transactions) {
      if (!map.has(t.categoryId)) {
        map.set(t.categoryId, {
          id: t.categoryId,
          name: t.categoryName,
          color: t.categoryColor,
          icon: t.categoryIcon,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [transactions]);

  const selectedCategory = monthCategories.find((c) => c.id === selectedCategoryId) ?? null;
  const isUncategorizedView = selectedCategory?.name === UNCATEGORIZED_NAME;

  const dayTransactions = transactions.filter((t) => t.transactionDate === selectedDateKey);
  const categoryTransactions = useMemo(
    () =>
      selectedCategoryId === null
        ? []
        : transactions
            .filter((t) => t.categoryId === selectedCategoryId)
            .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate)),
    [transactions, selectedCategoryId],
  );
  const listTransactions = selectedCategoryId === null ? dayTransactions : categoryTransactions;

  const changeMonth = (delta: number) => {
    const next = addMonths(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  const handleReassignCategory = (transaction: Transaction, newCategoryId: number) => {
    updateTransaction.mutate({
      id: transaction.id,
      data: {
        type: transaction.type,
        amount: transaction.amount,
        transactionDate: transaction.transactionDate,
        categoryId: newCategoryId,
        cardId: transaction.cardId,
        memo: transaction.memo,
      },
    });
  };

  const openCreate = (type: TransactionType) => {
    setEditingTransaction(null);
    setCreateType(type);
    setModalVisible(true);
  };

  const openEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setModalVisible(true);
  };

  const calendarColumn = (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => changeMonth(-1)} className="px-3 py-2">
          <Text className="text-xl text-slate-600">‹</Text>
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">{formatMonthLabel(year, month)}</Text>
        <Pressable onPress={() => changeMonth(1)} className="px-3 py-2">
          <Text className="text-xl text-slate-600">›</Text>
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
          onSelectDate={(dateKey) => {
            setSelectedDateKey(dateKey);
            setSelectedCategoryId(null);
          }}
        />
      )}

      {monthCategories.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-1">
          <Chip label="전체" selected={selectedCategoryId === null} onPress={() => setSelectedCategoryId(null)} />
          {monthCategories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              color={category.color}
              icon={category.icon}
              selected={selectedCategoryId === category.id}
              onPress={() => setSelectedCategoryId(category.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      <View className="flex-row items-center justify-between gap-2 border-t border-slate-200 pt-4">
        <Text className="flex-1 text-base font-semibold text-slate-900" numberOfLines={1}>
          {selectedCategory
            ? `${selectedCategory.icon ? `${selectedCategory.icon} ` : ''}${selectedCategory.name} · ${listTransactions.length}건`
            : selectedDateKey}
        </Text>
        <View className="flex-row gap-1.5">
          <Pressable onPress={() => openCreate('INCOME')} className="rounded-full bg-income px-3.5 py-2">
            <Text className="text-sm font-semibold text-white">+ 수입</Text>
          </Pressable>
          <Pressable onPress={() => openCreate('EXPENSE')} className="rounded-full bg-expense px-3.5 py-2">
            <Text className="text-sm font-semibold text-white">- 지출</Text>
          </Pressable>
        </View>
      </View>

      <View className="gap-2">
        {listTransactions.length === 0 ? (
          <Text className="py-4 text-center text-slate-400">
            {selectedCategory ? '이 카테고리 내역이 없습니다.' : '등록된 내역이 없습니다.'}
          </Text>
        ) : (
          listTransactions.map((transaction) => {
            const reassignOptions = isUncategorizedView
              ? allCategories.filter((c) => c.type === transaction.type && c.id !== transaction.categoryId)
              : [];
            const isReassigning =
              updateTransaction.isPending && updateTransaction.variables?.id === transaction.id;

            return (
              <View key={transaction.id} className="gap-2 rounded-xl bg-white p-4">
                <Pressable
                  onPress={() => openEdit(transaction)}
                  className="flex-row items-center justify-between">
                  <View className="flex-1 gap-0.5">
                    <Text className="font-medium text-slate-900">
                      {selectedCategory
                        ? transaction.transactionDate
                        : `${transaction.categoryIcon ? `${transaction.categoryIcon} ` : ''}${transaction.categoryName}`}
                    </Text>
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

                {isUncategorizedView ? (
                  <View className="flex-row flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                    {reassignOptions.map((category) => (
                      <Chip
                        key={category.id}
                        label={category.name}
                        color={category.color}
                        icon={category.icon}
                        selected={false}
                        onPress={() => {
                          if (!isReassigning) handleReassignCategory(transaction, category.id);
                        }}
                      />
                    ))}
                    <Pressable
                      onPress={() => setAddingCategoryType(transaction.type)}
                      className="flex-row items-center gap-1.5 rounded-full border border-dashed border-primary px-3.5 py-2">
                      <Text className="text-sm font-medium text-primary">+ 카테고리 추가</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </View>
  );

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[1100px]' : 'max-w-[480px]'}>
      {isDesktop ? (
        <View className="flex-row items-start justify-center gap-6">
          <View className="w-[480px]">{calendarColumn}</View>
          <MonthSummaryPanel year={year} month={month} />
        </View>
      ) : (
        calendarColumn
      )}

      <TransactionFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        dateKey={selectedDateKey}
        transaction={editingTransaction}
        initialType={createType}
      />

      <CategoryFormModal
        visible={addingCategoryType !== null}
        onClose={() => setAddingCategoryType(null)}
        category={null}
        initialType={addingCategoryType ?? 'EXPENSE'}
      />
    </Screen>
  );
}
