import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { type AdminUser, useAdminUsers, useBlockUser, useDeleteAdminUser, useUnblockUser } from '@/features/admin/api';

const ROLE_LABEL: Record<string, string> = { OWNER: '오너', MEMBER: '멤버' };

function UserRow({ user }: { user: AdminUser }) {
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const deleteMutation = useDeleteAdminUser();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
    deleteMutation.mutate(user.id, { onSettled: () => setConfirmingDelete(false) });
  };

  const toggleBlockPending = blockMutation.isPending || unblockMutation.isPending;

  return (
    <View className="flex-row items-center gap-3 border-b border-slate-800 px-6 py-3">
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-medium text-white">
          {user.name}
          {user.blocked ? <Text className="text-xs font-normal text-red-400"> · 차단됨</Text> : null}
        </Text>
        <Text className="text-xs text-slate-400">{user.email}</Text>
        <Text className="text-xs text-slate-500">
          {user.householdName ? `${user.householdName} · ${ROLE_LABEL[user.householdRole ?? ''] ?? user.householdRole}` : '가계부 없음'}
          {' · 거래 '}
          {user.transactionCount}건
        </Text>
      </View>
      <Pressable onPress={handleToggleBlock} className="rounded-lg bg-slate-800 px-3 py-2 active:bg-slate-700">
        <Text className="text-xs font-medium text-slate-200">
          {toggleBlockPending ? '...' : user.blocked ? '차단 해제' : '차단'}
        </Text>
      </Pressable>
      <Pressable
        onPress={handleDelete}
        className={`rounded-lg px-3 py-2 ${confirmingDelete ? 'bg-red-600 active:bg-red-700' : 'bg-slate-800 active:bg-slate-700'}`}>
        <Text className="text-xs font-medium text-white">
          {deleteMutation.isPending ? '...' : confirmingDelete ? '정말 탈퇴?' : '강제 탈퇴'}
        </Text>
      </Pressable>
    </View>
  );
}

export default function AdminUsersScreen() {
  const { data: users = [], isLoading } = useAdminUsers();

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
        <Text className="text-lg font-semibold text-white">전체 회원 ({users.length}명)</Text>
      </View>
      <View>
        {users.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </View>
    </ScrollView>
  );
}
