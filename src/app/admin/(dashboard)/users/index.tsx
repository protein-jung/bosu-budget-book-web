import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { type AdminUser, useAdminUsers, useBlockUser, useDeleteAdminUser, useUnblockUser } from '@/features/admin/api';

const ROLE_LABEL: Record<string, string> = { OWNER: '오너', MEMBER: '멤버' };
const AVATAR_PALETTE = ['#02007D', '#E07A5F', '#2f9e44', '#3b82f6', '#a855f7', '#f59e0b'];

function avatarColor(seed: number) {
  return AVATAR_PALETTE[seed % AVATAR_PALETTE.length];
}

function UserRow({ user }: { user: AdminUser }) {
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const deleteMutation = useDeleteAdminUser();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleToggleBlock = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (user.blocked) {
      unblockMutation.mutate(user.id);
    } else {
      blockMutation.mutate(user.id);
    }
  };

  const handleDelete = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteMutation.mutate(user.id, { onSettled: () => setConfirmingDelete(false) });
  };

  const toggleBlockPending = blockMutation.isPending || unblockMutation.isPending;

  return (
    <Pressable
      onPress={() => router.push(`/admin/users/${user.id}`)}
      className="flex-row items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: avatarColor(user.id) }}>
        <Text className="text-base font-bold text-white">{user.name.slice(0, 1)}</Text>
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-semibold text-slate-900" numberOfLines={1}>
            {user.name}
          </Text>
          {user.blocked ? (
            <View className="rounded-full bg-red-50 px-2 py-0.5">
              <Text className="text-[11px] font-semibold text-red-500">차단됨</Text>
            </View>
          ) : null}
        </View>
        <Text className="text-xs text-slate-400" numberOfLines={1}>
          {user.email}
        </Text>
        <Text className="text-xs text-slate-400" numberOfLines={1}>
          {user.householdName
            ? `${user.householdName} · ${ROLE_LABEL[user.householdRole ?? ''] ?? user.householdRole}`
            : '가계부 없음'}
          {' · 거래 '}
          {user.transactionCount}건
        </Text>
      </View>
      <Pressable
        onPress={handleToggleBlock}
        className="rounded-lg bg-slate-100 px-3 py-2 active:bg-slate-200">
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
      <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
    </Pressable>
  );
}

export default function AdminUsersScreen() {
  const { data: users = [], isLoading } = useAdminUsers();

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
          <Text className="text-2xl font-bold text-slate-900">전체 회원 ({users.length}명)</Text>
          <Text className="text-sm text-slate-500">눌러서 상세 거래 내역을 볼 수 있어요.</Text>
        </View>
        <View className="gap-2.5">
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
