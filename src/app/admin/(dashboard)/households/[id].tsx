import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { CalendarGrid } from '@/components/CalendarGrid';
import { Chip } from '@/components/Chip';
import {
  type AdminCategoryTotal,
  useAdminHouseholdDetail,
  useAdminHouseholdTransactions,
} from '@/features/admin/api';
import { addMonths, formatMonthLabel, toDateKey } from '@/lib/calendar';
import { formatKrw, formatSignedKrw } from '@/lib/format';

const ROLE_LABEL: Record<string, string> = { OWNER: '오너', MEMBER: '멤버' };
const AVATAR_PALETTE = ['#02007D', '#E07A5F', '#2f9e44', '#3b82f6', '#a855f7', '#f59e0b'];

function avatarColor(seed: number) {
  return AVATAR_PALETTE[seed % AVATAR_PALETTE.length];
}

function CategoryBar({ item, max }: { item: AdminCategoryTotal; max: number }) {
  const pct = max > 0 ? (item.total / max) * 100 : 0;
  const barColor = item.categoryColor ?? (item.type === 'INCOME' ? '#2f9e44' : '#02007D');
  return (
    <View className="gap-1.5">
      <View className="flex-row items-baseline justify-between gap-2">
        <Text className="flex-1 text-sm font-medium text-slate-700" numberOfLines={1}>
          {item.categoryIcon ? `${item.categoryIcon} ` : ''}
          {item.categoryName}
          <Text className="text-xs font-normal text-slate-400"> ({item.count}건)</Text>
        </Text>
        <Text className="text-sm font-semibold text-slate-900">{formatKrw(item.total)}</Text>
      </View>
      <View className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <View className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: barColor }} />
      </View>
    </View>
  );
}

export default function AdminHouseholdDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const householdId = Number(id);
  const { data, isLoading } = useAdminHouseholdDetail(householdId);

  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(today));
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const { data: transactions = [], isLoading: transactionsLoading } = useAdminHouseholdTransactions(
    householdId,
    year,
    month,
  );

  const summaries = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    for (const t of transactions) {
      const entry = map[t.transactionDate] ?? { income: 0, expense: 0 };
      if (t.type === 'INCOME') entry.income += t.amount;
      else entry.expense += t.amount;
      map[t.transactionDate] = entry;
    }
    return map;
  }, [transactions]);

  const monthCategories = useMemo(() => {
    const map = new Map<number, { id: number; name: string; color: string | null; icon: string | null }>();
    for (const t of transactions) {
      if (!map.has(t.categoryId)) {
        map.set(t.categoryId, { id: t.categoryId, name: t.categoryName, color: t.categoryColor, icon: t.categoryIcon });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [transactions]);

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

  const selectDate = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    setSelectedCategoryId(null);
  };

  const changeMonth = (delta: number) => {
    const next = addMonths(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator color="#01003D" />
      </View>
    );
  }

  const expenseTotals = data.categoryTotals.filter((c) => c.type === 'EXPENSE');
  const incomeTotals = data.categoryTotals.filter((c) => c.type === 'INCOME');
  const maxExpense = Math.max(0, ...expenseTotals.map((c) => c.total));
  const maxIncome = Math.max(0, ...incomeTotals.map((c) => c.total));
  const selectedCategory = monthCategories.find((c) => c.id === selectedCategoryId) ?? null;

  return (
    <ScrollView className="flex-1 bg-slate-100">
      <View className="mx-auto w-full max-w-[1100px] gap-6 p-6 md:p-8">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 self-start">
          <Ionicons name="chevron-back" size={16} color="#475569" />
          <Text className="text-sm font-medium text-slate-500">가계부 목록으로</Text>
        </Pressable>

        <View className="gap-4 rounded-2xl bg-white p-5 shadow-sm">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-light">
              <Ionicons name="home" size={20} color="#02007D" />
            </View>
            <View className="gap-0.5">
              <Text className="text-xl font-bold text-slate-900">{data.name}</Text>
              <Text className="text-xs text-slate-400">
                초대코드 {data.inviteCode} · {data.createdAt.slice(0, 10)} 생성
              </Text>
            </View>
          </View>
          <View className="flex-row gap-4 border-t border-slate-100 pt-4">
            <View className="gap-0.5">
              <Text className="text-xs text-slate-400">구성원</Text>
              <Text className="text-base font-bold text-slate-900">{data.members.length}명</Text>
            </View>
            <View className="gap-0.5">
              <Text className="text-xs text-slate-400">전체 거래</Text>
              <Text className="text-base font-bold text-slate-900">{data.transactionCount}건</Text>
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2.5">
          {data.members.map((member) => (
            <View
              key={member.userId}
              className="flex-row items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <View
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: avatarColor(member.userId) }}>
                <Text className="text-xs font-bold text-white">{member.name.slice(0, 1)}</Text>
              </View>
              <View>
                <Text className="text-sm font-semibold text-slate-900">{member.name}</Text>
                <Text className="text-xs text-slate-400">
                  {ROLE_LABEL[member.role] ?? member.role} · {member.email}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="flex-row flex-wrap items-start gap-5">
          {/* 실제 이용자가 보는 달력 화면을 그대로 재사용 — 수정/삭제 없이 조회만 된다. */}
          <View className="min-w-[320px] flex-[2] gap-4 rounded-2xl bg-white p-5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-slate-500">달력 (읽기 전용)</Text>
              <View className="flex-row items-center gap-1">
                <Pressable onPress={() => changeMonth(-1)} className="px-2 py-1">
                  <Ionicons name="chevron-back" size={16} color="#475569" />
                </Pressable>
                <Text className="min-w-[92px] text-center text-sm font-bold text-slate-900">
                  {formatMonthLabel(year, month)}
                </Text>
                <Pressable onPress={() => changeMonth(1)} className="px-2 py-1">
                  <Ionicons name="chevron-forward" size={16} color="#475569" />
                </Pressable>
              </View>
            </View>

            {transactionsLoading ? (
              <ActivityIndicator color="#01003D" />
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
                <Chip label="전체" selected={selectedCategoryId === null} onPress={() => setSelectedCategoryId(null)} />
                {monthCategories.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.name}
                    color={c.color}
                    icon={c.icon}
                    selected={selectedCategoryId === c.id}
                    onPress={() => setSelectedCategoryId(c.id)}
                  />
                ))}
              </ScrollView>
            ) : null}

            <View className="gap-2 border-t border-slate-100 pt-3">
              <Text className="text-xs font-semibold text-slate-400">
                {selectedCategory ? `${selectedCategory.name} · ` : `${selectedDateKey} · `}
                {listTransactions.length}건
              </Text>
              {listTransactions.length === 0 ? (
                <Text className="py-3 text-center text-sm text-slate-400">내역이 없어요.</Text>
              ) : (
                listTransactions.map((t) => (
                  <View
                    key={t.id}
                    className="flex-row items-center justify-between gap-2 border-b border-slate-50 py-2">
                    <View className="min-w-0 flex-1 gap-0.5">
                      <Text className="text-sm text-slate-700" numberOfLines={1}>
                        {selectedCategory
                          ? t.transactionDate
                          : `${t.categoryIcon ? `${t.categoryIcon} ` : ''}${t.categoryName}`}
                        {t.memo ? ` · ${t.memo}` : ''}
                      </Text>
                      <Text className="text-xs text-slate-400" numberOfLines={1}>
                        {t.userName}
                        {t.cardName ? ` · ${t.cardName}` : ''}
                      </Text>
                    </View>
                    <Text className={`text-sm font-semibold ${t.type === 'INCOME' ? 'text-income' : 'text-expense'}`}>
                      {formatSignedKrw(t.amount, t.type)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>

          {data.categoryTotals.length > 0 ? (
            <View className="min-w-[280px] flex-1 gap-5">
              {expenseTotals.length > 0 ? (
                <View className="gap-3 rounded-2xl bg-white p-5 shadow-sm">
                  <Text className="text-sm font-semibold text-slate-500">지출 카테고리 합계 (전체 기간)</Text>
                  <View className="gap-3">
                    {expenseTotals.slice(0, 8).map((item) => (
                      <CategoryBar key={`${item.categoryName}-EXPENSE`} item={item} max={maxExpense} />
                    ))}
                  </View>
                </View>
              ) : null}
              {incomeTotals.length > 0 ? (
                <View className="gap-3 rounded-2xl bg-white p-5 shadow-sm">
                  <Text className="text-sm font-semibold text-slate-500">수입 카테고리 합계 (전체 기간)</Text>
                  <View className="gap-3">
                    {incomeTotals.slice(0, 8).map((item) => (
                      <CategoryBar key={`${item.categoryName}-INCOME`} item={item} max={maxIncome} />
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}
