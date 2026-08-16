import { ActivityIndicator, Text, View } from 'react-native';

import { useAdminStats } from '@/features/admin/api';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="min-w-[160px] flex-1 gap-1 rounded-xl bg-slate-900 p-4">
      <Text className="text-xs text-slate-400">{label}</Text>
      <Text className="text-2xl font-bold text-white">{value}</Text>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading || !stats) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  return (
    <View className="flex-1 gap-4 bg-slate-950 p-6">
      <Text className="text-lg font-semibold text-white">서비스 통계</Text>
      <View className="flex-row flex-wrap gap-4">
        <StatCard label="전체 회원" value={stats.totalUsers} />
        <StatCard label="전체 가계부" value={stats.totalHouseholds} />
        <StatCard label="전체 거래" value={stats.totalTransactions} />
        <StatCard label="최근 7일 신규 회원" value={stats.newUsersLast7Days} />
        <StatCard label="최근 7일 신규 가계부" value={stats.newHouseholdsLast7Days} />
      </View>
    </View>
  );
}
