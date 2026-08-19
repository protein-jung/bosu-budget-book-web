import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useRecurringExpenses, useSetRecurringExpenseActive } from '@/features/recurringExpense/api';
import { RecurringExpenseFormModal } from '@/features/recurringExpense/RecurringExpenseFormModal';
import { getErrorMessage } from '@/lib/apiClient';
import { formatKrw } from '@/lib/format';
import { useIsDesktop } from '@/lib/responsive';
import type { RecurringExpense } from '@/lib/types';
import { toast } from '@/store/toastStore';

export default function RecurringExpensesScreen() {
  const { data: recurringExpenses = [] } = useRecurringExpenses();
  const setActive = useSetRecurringExpenseActive();
  const [editing, setEditing] = useState<RecurringExpense | null | undefined>(undefined);
  const isDesktop = useIsDesktop();

  const handleToggle = (item: RecurringExpense, next: boolean) => {
    setActive.mutate(
      { id: item.id, active: next },
      { onError: (err) => toast.error(getErrorMessage(err, '변경에 실패했습니다.')) },
    );
  };

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[680px]' : 'max-w-[480px]'}>
      <Text className="text-xs text-slate-400">
        매달 지정한 날짜가 되면 지출 내역이 자동으로 추가돼요. 끄면 그 고정비는 추가되지 않아요.
      </Text>

      <View className="gap-2">
        {recurringExpenses.length === 0 ? (
          <Text className="text-sm text-slate-400">아직 등록된 고정비가 없어요.</Text>
        ) : (
          recurringExpenses.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
              <Pressable className="min-w-0 flex-1 gap-1" onPress={() => setEditing(item)}>
                <Text className="text-base font-semibold text-slate-900 dark:text-white" numberOfLines={1}>
                  {item.categoryIcon ? `${item.categoryIcon} ` : ''}
                  {item.name}
                </Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400" numberOfLines={1}>
                  {item.categoryName} · 매달 {item.dayOfMonth}일 · {formatKrw(item.amount)}
                </Text>
                {item.memo ? (
                  <Text className="text-xs text-slate-400" numberOfLines={1}>
                    {item.memo}
                  </Text>
                ) : null}
              </Pressable>
              <Switch
                value={item.active}
                onValueChange={(next) => handleToggle(item, next)}
                trackColor={{ false: '#cbd5e1', true: '#1F6F5C' }}
                thumbColor="#ffffff"
              />
            </View>
          ))
        )}
      </View>

      <Pressable
        onPress={() => setEditing(null)}
        className={`items-center rounded-xl bg-primary p-4 ${isDesktop ? 'self-start px-8' : ''}`}>
        <Text className="font-semibold text-white">+ 고정비 추가</Text>
      </Pressable>

      <RecurringExpenseFormModal
        visible={editing !== undefined}
        onClose={() => setEditing(undefined)}
        recurringExpense={editing}
      />
    </Screen>
  );
}
