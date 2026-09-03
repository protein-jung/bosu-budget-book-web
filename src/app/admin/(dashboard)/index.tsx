import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { TrendLineChart, type TrendPoint } from '@/components/charts/TrendLineChart';
import { type AdminTrendPoint, useAdminStats, useAdminTrends } from '@/features/admin/api';
import { formatKrw } from '@/lib/format';

type StatColor = 'primary' | 'secondary' | 'income' | 'expense' | 'slate';

const COLOR_MAP: Record<StatColor, { bg: string; icon: string; text: string }> = {
  primary: { bg: '#E3E2F8', icon: '#02007D', text: '#01003D' },
  secondary: { bg: '#FBE7E0', icon: '#E07A5F', text: '#B85A40' },
  income: { bg: '#E4F5E9', icon: '#2f9e44', text: '#1f7a34' },
  expense: { bg: '#FBE9E9', icon: '#e03131', text: '#b42318' },
  slate: { bg: '#E2E8F0', icon: '#475569', text: '#1e293b' },
};

function StatCard({
  label,
  value,
  icon,
  color,
  caption,
  wide,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: StatColor;
  caption?: string;
  wide?: boolean;
}) {
  const palette = COLOR_MAP[color];
  return (
    <View
      className={`gap-3 rounded-2xl bg-white p-5 shadow-sm ${
        wide ? 'min-w-[280px] basis-[48%] p-6' : 'min-w-[200px] flex-1'
      }`}>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-slate-500">{label}</Text>
        <View
          className={`items-center justify-center rounded-full ${wide ? 'h-11 w-11' : 'h-9 w-9'}`}
          style={{ backgroundColor: palette.bg }}>
          <Ionicons name={icon} size={wide ? 20 : 17} color={palette.icon} />
        </View>
      </View>
      <Text className={wide ? 'text-4xl font-extrabold' : 'text-3xl font-extrabold'} style={{ color: palette.text }}>
        {value}
      </Text>
      {caption ? <Text className="text-xs font-medium text-slate-400">{caption}</Text> : null}
    </View>
  );
}

function toTrendPoints(points: AdminTrendPoint[]): TrendPoint[] {
  return points.map((p) => {
    const [, month, day] = p.date.split('-');
    return { key: p.date, label: `${month}.${day}`, value: p.value };
  });
}

function TrendCard({
  title,
  points,
  color,
  formatValue,
}: {
  title: string;
  points: TrendPoint[];
  color: string;
  formatValue: (value: number) => string;
}) {
  const [width, setWidth] = useState(0);
  return (
    <View className="min-w-[300px] flex-1 rounded-2xl bg-white p-5 shadow-sm">
      <View className="gap-3" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <Text className="text-sm font-semibold text-slate-500">{title}</Text>
        {points.length > 1 && width > 0 ? (
          <TrendLineChart data={points} width={width} color={color} formatValue={formatValue} />
        ) : (
          <Text className="py-8 text-center text-xs text-slate-400">데이터가 더 쌓이면 표시돼요.</Text>
        )}
      </View>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: trends } = useAdminTrends(30);

  const userGrowthPoints = useMemo(() => toTrendPoints(trends?.userGrowth ?? []), [trends]);
  const incomePoints = useMemo(() => toTrendPoints(trends?.dailyIncome ?? []), [trends]);
  const expensePoints = useMemo(() => toTrendPoints(trends?.dailyExpense ?? []), [trends]);

  if (isLoading || !stats) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator color="#01003D" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-100">
      <View className="mx-auto w-full max-w-[1100px] gap-6 p-6 md:p-8">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-slate-900">서비스 현황</Text>
          <Text className="text-sm text-slate-500">전체 회원과 가계부의 실시간 요약이에요.</Text>
        </View>

        <View className="flex-row flex-wrap gap-4">
          <StatCard label="전체 수입 합계" value={formatKrw(stats.totalIncome)} icon="trending-up" color="income" wide />
          <StatCard
            label="전체 지출 합계"
            value={formatKrw(stats.totalExpense)}
            icon="trending-down"
            color="expense"
            wide
          />
        </View>

        <View className="flex-row flex-wrap gap-4">
          <StatCard label="전체 회원" value={stats.totalUsers} icon="people" color="primary" />
          <StatCard label="전체 가계부" value={stats.totalHouseholds} icon="wallet" color="secondary" />
          <StatCard label="전체 거래" value={stats.totalTransactions.toLocaleString()} icon="swap-horizontal" color="slate" />
          <StatCard
            label="최근 7일 신규 회원"
            value={`+${stats.newUsersLast7Days}`}
            icon="person-add"
            color="income"
            caption="지난 일주일"
          />
          <StatCard
            label="최근 7일 신규 가계부"
            value={`+${stats.newHouseholdsLast7Days}`}
            icon="home"
            color="income"
            caption="지난 일주일"
          />
        </View>

        <View className="gap-3">
          <Text className="text-sm font-semibold text-slate-500">최근 30일 추이</Text>
          <View className="flex-row flex-wrap gap-4">
            <TrendCard
              title="회원 증가"
              points={userGrowthPoints}
              color="#02007D"
              formatValue={(v) => `${Math.round(v).toLocaleString()}명`}
            />
            <TrendCard title="일별 수입" points={incomePoints} color="#2f9e44" formatValue={formatKrw} />
            <TrendCard title="일별 지출" points={expensePoints} color="#e03131" formatValue={formatKrw} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
