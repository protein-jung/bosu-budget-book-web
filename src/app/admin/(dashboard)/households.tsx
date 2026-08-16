import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { useAdminHouseholds } from '@/features/admin/api';

export default function AdminHouseholdsScreen() {
  const { data: households = [], isLoading } = useAdminHouseholds();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-950">
      <View className="p-6 pb-4">
        <Text className="text-lg font-semibold text-white">전체 가계부 ({households.length}개)</Text>
      </View>
      <View>
        {households.map((household) => (
          <View key={household.id} className="gap-1 border-b border-slate-800 px-6 py-3">
            <Text className="text-sm font-medium text-white">{household.name}</Text>
            <Text className="text-xs text-slate-400">구성원: {household.memberNames.join(', ') || '없음'}</Text>
            <Text className="text-xs text-slate-500">
              초대코드 {household.inviteCode} · 거래 {household.transactionCount}건
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
