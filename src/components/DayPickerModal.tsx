import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { addMonths, formatMonthLabel, toDateKey } from '@/lib/calendar';

import { CalendarGrid } from './CalendarGrid';

const YEAR_RANGE_PAST = 30;
const YEAR_RANGE_FUTURE = 1;

export function DayPickerModal({
  visible,
  onClose,
  onSelectDate,
  initialDateKey,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateKey: string) => void;
  initialDateKey?: string;
}) {
  const today = useMemo(() => new Date(), []);
  const initial = initialDateKey ? new Date(initialDateKey) : today;
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth() + 1);
  const [pickingYear, setPickingYear] = useState(false);

  const changeMonth = (delta: number) => {
    const next = addMonths(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  const years = useMemo(() => {
    const thisYear = today.getFullYear();
    const list: number[] = [];
    for (let y = thisYear + YEAR_RANGE_FUTURE; y >= thisYear - YEAR_RANGE_PAST; y -= 1) {
      list.push(y);
    }
    return list;
  }, [today]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/40 p-6"
        onPress={() => {
          setPickingYear(false);
          onClose();
        }}>
        <Pressable
          className="w-[300px] gap-2 rounded-2xl bg-white p-3 dark:bg-slate-900"
          onPress={(e) => e.stopPropagation()}>
          <View className="flex-row items-center justify-center gap-4">
            <Pressable onPress={() => changeMonth(-1)} className="px-3 py-1" disabled={pickingYear}>
              <Text className="text-lg text-slate-600 dark:text-slate-300">‹</Text>
            </Pressable>
            <Pressable onPress={() => setPickingYear((prev) => !prev)}>
              <Text className="font-medium text-slate-900 dark:text-white">
                {formatMonthLabel(year, month)} {pickingYear ? '▲' : '▼'}
              </Text>
            </Pressable>
            <Pressable onPress={() => changeMonth(1)} className="px-3 py-1" disabled={pickingYear}>
              <Text className="text-lg text-slate-600 dark:text-slate-300">›</Text>
            </Pressable>
          </View>

          {pickingYear ? (
            <ScrollView className="max-h-56" showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap gap-1.5 py-1">
                {years.map((y) => (
                  <Pressable
                    key={y}
                    onPress={() => {
                      setYear(y);
                      setPickingYear(false);
                    }}
                    className={`rounded-lg px-3 py-2 ${
                      y === year ? 'bg-primary-light dark:bg-primary-dark' : ''
                    }`}
                    style={{ width: '31%' }}>
                    <Text
                      className={`text-center text-sm ${
                        y === year ? 'font-bold text-primary dark:text-secondary' : 'text-slate-700 dark:text-slate-200'
                      }`}>
                      {y}년
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          ) : (
            <>
              <CalendarGrid
                year={year}
                month={month}
                summaries={{}}
                selectedDateKey={initialDateKey}
                onSelectDate={(dateKey) => {
                  onSelectDate(dateKey);
                  onClose();
                }}
              />
              <Pressable
                onPress={() => {
                  onSelectDate(toDateKey(today));
                  onClose();
                }}
                className="items-center py-2">
                <Text className="text-sm font-semibold text-primary">오늘</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
