import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useMonthlyTransactions } from '@/features/transaction/api';
import { formatKrw } from '@/lib/format';
import { useIsDesktop } from '@/lib/responsive';

import type { MemoTarget } from './CategoryMemoModal';

/** 통계 표의 금액 셀에서 "지출 내역" 버튼을 눌렀을 때, 그 달 그 카테고리에 실제로 어떤 거래들이
 * 잡혀서 그 금액이 됐는지 목록으로 보여준다 — 읽기 전용이라 수정/삭제는 달력에서 하도록 안내만 한다. */
export function CategorySpendingDetailModal({
  visible,
  onClose,
  target,
}: {
  visible: boolean;
  onClose: () => void;
  target: MemoTarget | null;
}) {
  const isDesktop = useIsDesktop();
  const { data: transactions = [], isLoading } = useMonthlyTransactions(
    target?.year ?? 0,
    target?.month ?? 0,
    target != null,
  );

  if (!target) return null;

  const items = transactions
    .filter((t) => t.categoryId === target.categoryId)
    .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
  const total = items.reduce((sum, t) => sum + t.amount, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className={`flex-1 bg-black/40 ${isDesktop ? 'items-center justify-center' : 'justify-end'}`}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className={`max-h-[80%] gap-4 bg-white p-5 dark:bg-slate-900 ${
            isDesktop ? 'w-full max-w-[480px] rounded-3xl' : 'rounded-t-3xl'
          }`}>
          <View className="gap-1">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              {target.icon ? `${target.icon} ` : ''}
              {target.categoryName}
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              {target.year}년 {target.month}월 지출 내역
            </Text>
          </View>

          <View className="flex-row items-center justify-between rounded-xl bg-cream p-4 dark:bg-slate-800">
            <Text className="text-sm text-slate-500 dark:text-slate-400">합계</Text>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">{formatKrw(total)}</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator />
          ) : items.length === 0 ? (
            <Text className="py-4 text-center text-sm text-slate-400">이 달엔 지출 내역이 없어요.</Text>
          ) : (
            <ScrollView className="max-h-[50vh]" showsVerticalScrollIndicator={false}>
              <View className="gap-2.5">
                {items.map((t) => (
                  <View
                    key={t.id}
                    className="flex-row items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                    <View className="flex-1 gap-0.5">
                      <Text className="text-sm text-slate-700 dark:text-slate-200">{t.transactionDate}</Text>
                      <Text className="text-xs text-slate-400" numberOfLines={1}>
                        {t.userName}
                        {t.cardName ? ` · ${t.cardName}` : ''}
                        {t.memo ? ` · ${t.memo}` : ''}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatKrw(t.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          <Button title="닫기" variant="secondary" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
