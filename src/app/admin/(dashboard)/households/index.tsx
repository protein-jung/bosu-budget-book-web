import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { useAdminHouseholds } from '@/features/admin/api';

export default function AdminHouseholdsScreen() {
  const { data: households = [], isLoading } = useAdminHouseholds();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator color="#01003D" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-100">
      <View className="mx-auto w-full max-w-[1100px] gap-4 p-6 md:p-8">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-slate-900">전체 가계부 ({households.length}개)</Text>
          <Text className="text-sm text-slate-500">눌러서 카테고리별 합계와 최근 거래를 볼 수 있어요.</Text>
        </View>
        <View className="gap-2.5">
          {households.map((household) => (
            <Pressable
              key={household.id}
              onPress={() => router.push(`/admin/households/${household.id}`)}
              className="flex-row items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-light">
                <Ionicons name="home" size={18} color="#02007D" />
              </View>
              <View className="min-w-0 flex-1 gap-0.5">
                <Text className="text-sm font-semibold text-slate-900" numberOfLines={1}>
                  {household.name}
                </Text>
                <Text className="text-xs text-slate-400" numberOfLines={1}>
                  구성원 {household.memberNames.join(', ') || '없음'}
                </Text>
                <Text className="text-xs text-slate-400" numberOfLines={1}>
                  초대코드 {household.inviteCode} · 거래 {household.transactionCount}건
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
