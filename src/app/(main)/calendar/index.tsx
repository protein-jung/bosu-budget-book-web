import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { CalendarGrid } from '@/components/CalendarGrid';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { YearPickerModal } from '@/components/YearPickerModal';
import { useCategories } from '@/features/category/api';
import { CategoryFormModal } from '@/features/category/CategoryFormModal';
import { useMonthlyTransactions, useUpdateTransaction } from '@/features/transaction/api';
import { useRangeStatistics } from '@/features/statistics/api';
import { MonthSummaryPanel, type ParentCategoryFilter } from '@/features/statistics/MonthSummaryPanel';
import { TransactionFormModal } from '@/features/transaction/TransactionFormModal';
import { addMonths, daysInMonth, formatMonthLabel, toDateKey } from '@/lib/calendar';
import { childCategories, topLevelCategories } from '@/lib/categoryTree';
import { formatKrw, formatSignedKrw } from '@/lib/format';
import { useIsDesktop } from '@/lib/responsive';
import type { Category, MonthlyTrendPoint, Transaction, TransactionType } from '@/lib/types';

const UNCATEGORIZED_NAME = '미분류';

/** 지난달과 이번 달 지출을 비교해 "지난달보다 얼마 더/덜 썼는지" 한 줄로 보여준다. 이번 달
 * 데이터만 있고 지난달 데이터가 아직 없으면(가계부를 막 시작한 경우) 비교할 게 없으니 숨긴다. */
function MonthComparisonCard({ months }: { months: MonthlyTrendPoint[] }) {
  if (months.length < 2) return null;
  const previous = months[months.length - 2];
  const current = months[months.length - 1];
  const diff = current.totalExpense - previous.totalExpense;
  if (diff === 0) return null;
  const spentMore = diff > 0;

  return (
    <View className="flex-row items-center gap-2 rounded-xl bg-white p-3.5 shadow-sm shadow-slate-200">
      <View className="h-2.5 w-2.5 rounded-full bg-primary" />
      <Text className="flex-1 text-sm text-slate-700">
        지난달보다{' '}
        <Text className={`font-semibold ${spentMore ? 'text-secondary' : 'text-primary'}`}>
          {formatKrw(Math.abs(diff))}
        </Text>
        {spentMore ? ' 더 썼어요' : ' 덜 썼어요'}
      </Text>
    </View>
  );
}

/** 이번 달 지금까지 쓴 속도(하루 평균 지출 × 이번 달 총 일수)로 이번 달 말 예상 지출을 추정하고,
 * 지금까지의 수입에서 빼서 예상 저축을 보여준다. 수입은 대개 월급날 한 번에 들어와서 이미 다
 * 들어온 걸로 보고 그대로 쓰고, 지출만 페이스를 추정한다. 지나간 달/미래 달을 보고 있을 땐(이미
 * 결과가 다 나왔거나 아직 시작 전이라) "예상"이 의미가 없으니 이번 달을 보고 있을 때만 보여준다. */
function ProjectedSavingsCard({
  transactions,
  excludedFromExpenseCategoryIds,
  year,
  month,
  today,
}: {
  transactions: Transaction[];
  excludedFromExpenseCategoryIds: Set<number>;
  year: number;
  month: number;
  today: Date;
}) {
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  if (!isCurrentMonth) return null;

  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === 'INCOME') income += t.amount;
    else if (!excludedFromExpenseCategoryIds.has(t.categoryId)) expense += t.amount;
  }

  const dayOfMonth = today.getDate();
  const totalDays = daysInMonth(year, month);
  const projectedExpense = (expense / dayOfMonth) * totalDays;
  const projectedSavings = income - projectedExpense;
  const isPositive = projectedSavings >= 0;

  return (
    <View className="flex-row items-center gap-2 rounded-xl bg-white p-3.5 shadow-sm shadow-slate-200">
      <View className="h-2.5 w-2.5 rounded-full bg-secondary" />
      <View className="flex-1">
        <Text className="text-sm text-slate-700">
          이번 달 예상 저축{' '}
          <Text className={`font-semibold ${isPositive ? 'text-primary' : 'text-secondary'}`}>
            {formatKrw(projectedSavings)}
          </Text>
        </Text>
        <Text className="text-xs text-slate-400">지금까지 쓴 속도를 기준으로 한 추정이에요</Text>
      </View>
    </View>
  );
}

/** 미분류 거래를 다른 카테고리로 재분류하는 칩 — 내역 추가/수정 화면의 카테고리 선택과 똑같이
 * 대분류를 먼저 고르고, 하위가 있으면 소분류에서 하나를 골라야 실제로 재분류된다. 하위가 없는
 * 단독 대분류는 바로 재분류된다. */
function UncategorizedCategoryPicker({
  transaction,
  categories,
  onReassign,
  onAddCategory,
}: {
  transaction: Transaction;
  categories: Category[];
  onReassign: (categoryId: number) => void;
  onAddCategory: () => void;
}) {
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);

  const topGroups = topLevelCategories(categories, transaction.type).filter((c) => c.id !== transaction.categoryId);
  const activeChildren = activeGroupId == null ? [] : childCategories(categories, transaction.type, activeGroupId);

  const handleSelectGroup = (group: Category) => {
    const children = childCategories(categories, transaction.type, group.id);
    if (children.length === 0) {
      onReassign(group.id);
      return;
    }
    setActiveGroupId((current) => (current === group.id ? null : group.id));
  };

  return (
    <View className="gap-1.5 border-t border-slate-100 pt-2">
      <View className="flex-row flex-wrap gap-1.5">
        {topGroups.map((group) => (
          <Chip
            key={group.id}
            label={group.name}
            icon={group.icon}
            color={group.color}
            selected={activeGroupId === group.id}
            onPress={() => handleSelectGroup(group)}
          />
        ))}
      </View>
      {activeChildren.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5">
          {activeChildren.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              icon={category.icon}
              color={category.color}
              selected={false}
              onPress={() => onReassign(category.id)}
            />
          ))}
        </View>
      ) : null}
      <Pressable
        onPress={onAddCategory}
        className="flex-row items-center gap-1.5 self-start rounded-full border border-dashed border-primary px-3.5 py-2">
        <Text className="text-sm font-medium text-primary">+ 카테고리 추가</Text>
      </Pressable>
    </View>
  );
}

export default function CalendarScreen() {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(today));
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null);
  const [selectedParentCategory, setSelectedParentCategory] = useState<ParentCategoryFilter | null>(null);
  const [selectedMemberUserId, setSelectedMemberUserId] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [createType, setCreateType] = useState<TransactionType>('EXPENSE');
  const [addingCategoryType, setAddingCategoryType] = useState<TransactionType | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const isDesktop = useIsDesktop();
  const { data: transactions = [], isLoading } = useMonthlyTransactions(year, month);
  const { data: allCategories = [] } = useCategories();
  const { data: rangeSummary } = useRangeStatistics(year, month, 2);
  const updateTransaction = useUpdateTransaction();

  const excludedFromExpenseCategoryIds = useMemo(
    () => new Set(allCategories.filter((c) => c.excludedFromExpenseStats).map((c) => c.id)),
    [allCategories],
  );

  const summaries = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    for (const transaction of transactions) {
      if (transaction.type === 'EXPENSE' && excludedFromExpenseCategoryIds.has(transaction.categoryId)) {
        continue;
      }
      const entry = map[transaction.transactionDate] ?? { income: 0, expense: 0 };
      if (transaction.type === 'INCOME') entry.income += transaction.amount;
      else entry.expense += transaction.amount;
      map[transaction.transactionDate] = entry;
    }
    return map;
  }, [transactions, excludedFromExpenseCategoryIds]);

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
  const typeTransactions = useMemo(
    () =>
      selectedType === null
        ? []
        : transactions
            .filter((t) => t.type === selectedType)
            .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate)),
    [transactions, selectedType],
  );
  const parentCategoryTransactions = useMemo(() => {
    if (selectedParentCategory === null) return [];
    const groupId = selectedParentCategory.id;
    const memberCategoryIds = new Set(
      allCategories.filter((c) => c.id === groupId || c.parentId === groupId).map((c) => c.id),
    );
    return transactions
      .filter((t) => memberCategoryIds.has(t.categoryId))
      .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
  }, [transactions, selectedParentCategory, allCategories]);
  const memberTransactions = useMemo(
    () =>
      selectedMemberUserId === null
        ? []
        : transactions
            .filter((t) => t.userId === selectedMemberUserId)
            .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate)),
    [transactions, selectedMemberUserId],
  );
  const cardTransactions = useMemo(
    () =>
      selectedCardId === null
        ? []
        : transactions
            .filter((t) => t.cardId === selectedCardId)
            .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate)),
    [transactions, selectedCardId],
  );
  const listTransactions =
    selectedMemberUserId !== null
      ? memberTransactions
      : selectedCardId !== null
        ? cardTransactions
        : selectedParentCategory !== null
          ? parentCategoryTransactions
          : selectedType !== null
            ? typeTransactions
            : selectedCategoryId === null
              ? dayTransactions
              : categoryTransactions;

  const selectDate = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    setSelectedCategoryId(null);
    setSelectedType(null);
    setSelectedParentCategory(null);
    setSelectedMemberUserId(null);
    setSelectedCardId(null);
  };

  const selectCategory = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedType(null);
    setSelectedParentCategory(null);
    setSelectedMemberUserId(null);
    setSelectedCardId(null);
  };

  const selectType = (type: TransactionType) => {
    setSelectedCategoryId(null);
    setSelectedParentCategory(null);
    setSelectedMemberUserId(null);
    setSelectedCardId(null);
    setSelectedType((current) => (current === type ? null : type));
  };

  const selectParentCategory = (group: ParentCategoryFilter) => {
    // "미분류"는 대분류라기보다 카테고리 하나에 가까우니, 대분류별 패널에서 눌러도
    // 달력 아래 카테고리 칩에서 미분류를 고른 것과 똑같이 동작해서 바로 재분류 UI가 뜨게 한다.
    if (group.name === UNCATEGORIZED_NAME) {
      selectCategory(group.id);
      return;
    }
    setSelectedCategoryId(null);
    setSelectedType(null);
    setSelectedMemberUserId(null);
    setSelectedCardId(null);
    setSelectedParentCategory((current) => (current?.id === group.id ? null : group));
  };

  const selectMember = (userId: number) => {
    setSelectedCategoryId(null);
    setSelectedType(null);
    setSelectedParentCategory(null);
    setSelectedCardId(null);
    setSelectedMemberUserId((current) => (current === userId ? null : userId));
  };

  const selectCard = (cardId: number) => {
    setSelectedCategoryId(null);
    setSelectedType(null);
    setSelectedParentCategory(null);
    setSelectedMemberUserId(null);
    setSelectedCardId((current) => (current === cardId ? null : cardId));
  };

  const changeMonth = (delta: number) => {
    const next = addMonths(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
    selectDate(toDateKey(today));
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
        <Pressable onPress={goToToday} className="w-11 items-start px-1 py-2">
          <Text className="text-xs font-semibold text-primary">오늘</Text>
        </Pressable>
        <View className="flex-row items-center">
          <Pressable onPress={() => changeMonth(-1)} className="px-3 py-2">
            <Text className="text-xl text-slate-600">‹</Text>
          </Pressable>
          <Pressable onPress={() => setShowYearPicker(true)} className="px-2 py-1">
            <Text className="text-lg font-bold text-slate-900">{formatMonthLabel(year, month)}</Text>
          </Pressable>
          <Pressable onPress={() => changeMonth(1)} className="px-3 py-2">
            <Text className="text-xl text-slate-600">›</Text>
          </Pressable>
        </View>
        <View className="w-11" />
      </View>

      {rangeSummary ? <MonthComparisonCard months={rangeSummary.months} /> : null}
      <ProjectedSavingsCard
        transactions={transactions}
        excludedFromExpenseCategoryIds={excludedFromExpenseCategoryIds}
        year={year}
        month={month}
        today={today}
      />

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <CalendarGrid
          year={year}
          month={month}
          summaries={summaries}
          selectedDateKey={selectedDateKey}
          onSelectDate={selectDate}
        />
      )}

      {monthCategories.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-1">
          <Chip label="전체" selected={selectedCategoryId === null && selectedType === null} onPress={() => selectCategory(null)} />
          {monthCategories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              color={category.color}
              icon={category.icon}
              selected={selectedCategoryId === category.id}
              onPress={() => selectCategory(category.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      <View className="flex-row items-center justify-between gap-2 border-t border-slate-200 pt-4">
        <Text className="flex-1 text-base font-semibold text-slate-900" numberOfLines={1}>
          {selectedMemberUserId !== null
            ? `${memberTransactions[0]?.userName ?? ''} · ${listTransactions.length}건`
            : selectedCardId !== null
              ? `${cardTransactions[0]?.cardName ?? ''} · ${listTransactions.length}건`
              : selectedParentCategory
                ? `${selectedParentCategory.icon ? `${selectedParentCategory.icon} ` : ''}${selectedParentCategory.name} · ${listTransactions.length}건`
                : selectedType
                  ? `${selectedType === 'INCOME' ? '수입' : '지출'} 전체 · ${listTransactions.length}건`
                  : selectedCategory
                    ? `${selectedCategory.icon ? `${selectedCategory.icon} ` : ''}${selectedCategory.name} · ${listTransactions.length}건`
                    : selectedDateKey}
        </Text>
        <View className="flex-row gap-1.5">
          <Pressable onPress={() => openCreate('INCOME')} className="rounded-full bg-primary px-3.5 py-2">
            <Text className="text-sm font-semibold text-white">+ 수입</Text>
          </Pressable>
          <Pressable onPress={() => openCreate('EXPENSE')} className="rounded-full bg-secondary px-3.5 py-2">
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
            const isReassigning =
              updateTransaction.isPending && updateTransaction.variables?.id === transaction.id;

            return (
              <View key={transaction.id} className="gap-2 rounded-xl bg-white p-4 shadow-sm shadow-slate-200">
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
                      {selectedType || selectedParentCategory || selectedMemberUserId !== null || selectedCardId !== null
                        ? `${transaction.transactionDate} · `
                        : ''}
                      {transaction.userName}
                      {transaction.cardName ? ` · ${transaction.cardName}` : ''}
                      {transaction.memo ? ` · ${transaction.memo}` : ''}
                    </Text>
                  </View>
                  <Text className={`font-semibold ${transaction.type === 'INCOME' ? 'text-primary' : 'text-secondary'}`}>
                    {formatSignedKrw(transaction.amount, transaction.type)}
                  </Text>
                </Pressable>

                {isUncategorizedView ? (
                  <UncategorizedCategoryPicker
                    transaction={transaction}
                    categories={allCategories}
                    onReassign={(categoryId) => {
                      if (!isReassigning) handleReassignCategory(transaction, categoryId);
                    }}
                    onAddCategory={() => setAddingCategoryType(transaction.type)}
                  />
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </View>
  );

  return (
    <Screen
      maxWidthClassName={isDesktop ? 'max-w-[1100px]' : 'max-w-[480px]'}
      backgroundClassName="bg-cream"
      footer>
      {isDesktop ? (
        <View className="flex-row items-start justify-center gap-6">
          <View className="w-[480px]">{calendarColumn}</View>
          <MonthSummaryPanel
            year={year}
            month={month}
            selectedType={selectedType}
            onSelectType={selectType}
            selectedParentCategoryId={selectedParentCategory?.id ?? (isUncategorizedView ? selectedCategoryId : null)}
            onSelectParentCategory={selectParentCategory}
            selectedMemberUserId={selectedMemberUserId}
            onSelectMember={selectMember}
            selectedCardId={selectedCardId}
            onSelectCard={selectCard}
          />
        </View>
      ) : (
        calendarColumn
      )}

      <TransactionFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        dateKey={editingTransaction?.transactionDate ?? selectedDateKey}
        transaction={editingTransaction}
        initialType={createType}
      />

      <CategoryFormModal
        visible={addingCategoryType !== null}
        onClose={() => setAddingCategoryType(null)}
        category={null}
        initialType={addingCategoryType ?? 'EXPENSE'}
      />

      <YearPickerModal
        visible={showYearPicker}
        onClose={() => setShowYearPicker(false)}
        year={year}
        onSelectYear={setYear}
      />
    </Screen>
  );
}
