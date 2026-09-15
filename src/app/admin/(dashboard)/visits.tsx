import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { TrendLineChart, type TrendPoint } from '@/components/charts/TrendLineChart';
import { useAdminPageViews } from '@/features/analytics/api';

const DAY_OPTIONS = [7, 30, 90] as const;

function toTrendPoints(daily: { date: string; value: number }[]): TrendPoint[] {
  return daily.map((p) => {
    const [, month, day] = p.date.split('-');
    return { key: p.date, label: `${month}.${day}`, value: p.value };
  });
}

function DayRangePicker({ days, onChange }: { days: number; onChange: (days: number) => void }) {
  return (
    <View className="flex-row gap-1.5">
      {DAY_OPTIONS.map((option) => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          className={`rounded-full px-4 py-2 ${days === option ? 'bg-primary' : 'bg-white'}`}>
          <Text className={`text-sm font-semibold ${days === option ? 'text-white' : 'text-slate-500'}`}>
            최근 {option}일
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="min-w-[200px] flex-1 gap-2 rounded-2xl bg-white p-5 shadow-sm">
      <Text className="text-sm font-medium text-slate-500">{label}</Text>
      <Text className="text-3xl font-extrabold text-slate-900">{value}</Text>
    </View>
  );
}

export default function AdminVisitsScreen() {
  const [days, setDays] = useState<number>(30);
  const { data, isLoading } = useAdminPageViews(days);
  const [chartWidth, setChartWidth] = useState(0);

  const dailyPoints = useMemo(() => toTrendPoints(data?.daily ?? []), [data]);

  return (
    <ScrollView className="flex-1 bg-slate-100">
      <View className="mx-auto w-full max-w-[1100px] gap-6 p-6 md:p-8">
        <View className="flex-row flex-wrap items-center justify-between gap-3">
          <View className="gap-1">
            <Text className="text-2xl font-bold text-slate-900">접속 통계</Text>
            <Text className="text-sm text-slate-500">
              로그인 전 웰컴·로그인·회원가입 화면을 포함한 프론트 전체 페이지 방문 기록이에요.
            </Text>
          </View>
          <DayRangePicker days={days} onChange={setDays} />
        </View>

        {isLoading || !data ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#082B29" />
          </View>
        ) : (
          <>
            <View className="flex-row flex-wrap gap-4">
              <StatCard label={`최근 ${days}일 조회수`} value={data.totalViews.toLocaleString()} />
              <StatCard label={`최근 ${days}일 순 방문자`} value={data.totalUniqueVisitors.toLocaleString()} />
            </View>

            <View className="gap-3 rounded-2xl bg-white p-5 shadow-sm">
              <Text className="text-sm font-semibold text-slate-500">일별 조회수 추이</Text>
              <View onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
                {dailyPoints.length > 1 && chartWidth > 0 ? (
                  <TrendLineChart
                    data={dailyPoints}
                    width={chartWidth}
                    color="#105753"
                    formatValue={(v) => `${Math.round(v).toLocaleString()}회`}
                  />
                ) : (
                  <Text className="py-8 text-center text-xs text-slate-400">데이터가 더 쌓이면 표시돼요.</Text>
                )}
              </View>
            </View>

            <View className="gap-2 rounded-2xl bg-white p-5 shadow-sm">
              <Text className="text-sm font-semibold text-slate-500">페이지별 조회수</Text>
              {data.byPath.length === 0 ? (
                <Text className="py-8 text-center text-xs text-slate-400">아직 기록된 방문이 없어요.</Text>
              ) : (
                <View className="mt-2 gap-1">
                  <View className="flex-row border-b border-slate-100 pb-2">
                    <Text className="flex-1 text-xs font-semibold text-slate-400">경로</Text>
                    <Text className="w-24 text-right text-xs font-semibold text-slate-400">조회수</Text>
                    <Text className="w-24 text-right text-xs font-semibold text-slate-400">순 방문자</Text>
                  </View>
                  {data.byPath.map((row) => (
                    <View key={row.path} className="flex-row items-center border-b border-slate-50 py-2.5">
                      <Text className="flex-1 text-sm text-slate-700" numberOfLines={1}>
                        {row.path}
                      </Text>
                      <Text className="w-24 text-right text-sm font-semibold text-slate-900">
                        {row.views.toLocaleString()}
                      </Text>
                      <Text className="w-24 text-right text-sm text-slate-500">
                        {row.uniqueVisitors.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
