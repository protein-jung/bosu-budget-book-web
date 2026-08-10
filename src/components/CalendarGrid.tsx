import { Pressable, Text, View } from 'react-native';

import { formatCompactKrw } from '@/lib/format';
import { getMonthMatrix, toDateKey } from '@/lib/calendar';

type DaySummary = { income: number; expense: number };

type CalendarGridProps = {
  year: number;
  month: number;
  summaries: Record<string, DaySummary>;
  selectedDateKey?: string;
  onSelectDate: (dateKey: string) => void;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function CalendarGrid({ year, month, summaries, selectedDateKey, onSelectDate }: CalendarGridProps) {
  const weeks = getMonthMatrix(year, month);
  const todayKey = toDateKey(new Date());

  return (
    <View className="gap-1">
      <View className="flex-row">
        {WEEKDAYS.map((weekday) => (
          <View key={weekday} className="flex-1 items-center py-2">
            <Text className="text-xs font-medium text-slate-400">{weekday}</Text>
          </View>
        ))}
      </View>
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} className="flex-row">
          {week.map((date, dayIndex) => {
            if (!date) {
              return <View key={dayIndex} className="aspect-square flex-1" />;
            }
            const dateKey = toDateKey(date);
            const summary = summaries[dateKey];
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDateKey;

            return (
              <Pressable
                key={dayIndex}
                onPress={() => onSelectDate(dateKey)}
                className={`aspect-square flex-1 items-center gap-0.5 rounded-lg p-1 pt-1.5 ${
                  isSelected ? 'bg-primary-light dark:bg-primary-dark' : isToday ? 'bg-primary-light/50 dark:bg-primary-dark/40' : ''
                }`}>
                <Text
                  className={`text-sm ${
                    isToday
                      ? 'font-bold text-primary dark:text-secondary'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}>
                  {date.getDate()}
                </Text>
                {summary?.expense ? (
                  <Text className="text-[10px] text-red-500" numberOfLines={1}>
                    -{formatCompactKrw(summary.expense)}
                  </Text>
                ) : null}
                {summary?.income ? (
                  <Text className="text-[10px] text-emerald-600" numberOfLines={1}>
                    +{formatCompactKrw(summary.income)}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
