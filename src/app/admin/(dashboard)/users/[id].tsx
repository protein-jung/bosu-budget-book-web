import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { useAdminUserDetail, useBlockUser, useDeleteAdminUser, useUnblockUser } from '@/features/admin/api';
import { formatKrw } from '@/lib/format';

const ROLE_LABEL: Record<string, string> = { OWNER: '오너', MEMBER: '멤버' };
const AVATAR_PALETTE = ['#02007D', '#E07A5F', '#2f9e44', '#3b82f6', '#a855f7', '#f59e0b'];

function avatarColor(seed: number) {
  return AVATAR_PALETTE[seed % AVATAR_PALETTE.length];
}

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const { data: user, isLoading } = useAdminUserDetail(userId);
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const deleteMutation = useDeleteAdminUser();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (isLoading || !user) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator color="#01003D" />
      </View>
    );
  }

  const toggleBlockPending = blockMutation.isPending || unblockMutation.isPending;

  const handleToggleBlock = () => {
    if (user.blocked) {
      unblockMutation.mutate(user.id);
    } else {
      blockMutation.mutate(user.id);
    }
  };

  const handleDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteMutation.mutate(user.id, {
      onSuccess: () => router.replace('/admin/users'),
      onSettled: () => setConfirmingDelete(false),
    });
  };

  return (
    <ScrollView className="flex-1 bg-slate-100">
      <View className="mx-auto w-full max-w-[900px] gap-6 p-6 md:p-8">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 self-start">
          <Ionicons name="chevron-back" size={16} color="#475569" />
          <Text className="text-sm font-medium text-slate-500">회원 목록으로</Text>
        </Pressable>

        <View className="gap-4 rounded-2xl bg-white p-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View
                className="h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: avatarColor(user.id) }}>
                <Text className="text-lg font-bold text-white">{user.name.slice(0, 1)}</Text>
              </View>
              <View className="gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl font-bold text-slate-900">{user.name}</Text>
                  {user.blocked ? (
                    <View className="rounded-full bg-red-50 px-2 py-0.5">
                      <Text className="text-[11px] font-semibold text-red-500">차단됨</Text>
                    </View>
                  ) : null}
                </View>
                <Text className="text-xs text-slate-400">{user.email}</Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              <Pressable onPress={handleToggleBlock} className="rounded-lg bg-slate-100 px-3 py-2 active:bg-slate-200">
                <Text className="text-xs font-medium text-slate-600">
                  {toggleBlockPending ? '...' : user.blocked ? '차단 해제' : '차단'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                className={`rounded-lg px-3 py-2 ${confirmingDelete ? 'bg-red-500 active:bg-red-600' : 'bg-slate-100 active:bg-slate-200'}`}>
                <Text className={`text-xs font-medium ${confirmingDelete ? 'text-white' : 'text-slate-600'}`}>
                  {deleteMutation.isPending ? '...' : confirmingDelete ? '정말 탈퇴?' : '강제 탈퇴'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-4 border-t border-slate-100 pt-4">
            <View className="gap-0.5">
              <Text className="text-xs text-slate-400">생년월일</Text>
              <Text className="text-sm font-semibold text-slate-900">{user.birthDate ?? '-'}</Text>
            </View>
            <View className="gap-0.5">
              <Text className="text-xs text-slate-400">가입일</Text>
              <Text className="text-sm font-semibold text-slate-900">{user.createdAt.slice(0, 10)}</Text>
            </View>
            <View className="gap-0.5">
              <Text className="text-xs text-slate-400">가계부</Text>
              <Text className="text-sm font-semibold text-slate-900">
                {user.householdName
                  ? `${user.householdName} (${ROLE_LABEL[user.householdRole ?? ''] ?? user.householdRole})`
                  : '없음'}
              </Text>
            </View>
            <View className="gap-0.5">
              <Text className="text-xs text-slate-400">전체 거래</Text>
              <Text className="text-sm font-semibold text-slate-900">{user.transactionCount}건</Text>
            </View>
          </View>
        </View>

        <View className="gap-3 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="text-sm font-semibold text-slate-500">최근 거래 (최대 50건)</Text>
          {user.recentTransactions.length === 0 ? (
            <Text className="py-4 text-center text-sm text-slate-400">거래 내역이 없어요.</Text>
          ) : (
            <View className="gap-2">
              {user.recentTransactions.map((t) => (
                <View
                  key={t.id}
                  className="flex-row items-center justify-between gap-2 border-b border-slate-50 pb-2.5">
                  <View className="min-w-0 flex-1 gap-0.5">
                    <Text className="text-sm text-slate-700" numberOfLines={1}>
                      {t.categoryIcon ? `${t.categoryIcon} ` : ''}
                      {t.categoryName}
                      {t.memo ? ` · ${t.memo}` : ''}
                    </Text>
                    <Text className="text-xs text-slate-400" numberOfLines={1}>
                      {t.transactionDate}
                      {t.cardName ? ` · ${t.cardName}` : ''}
                    </Text>
                  </View>
                  <Text
                    className={`text-sm font-semibold ${t.type === 'INCOME' ? 'text-income' : 'text-expense'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}
                    {formatKrw(t.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
