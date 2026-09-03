import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/features/notification/api';
import { useIsDesktop } from '@/lib/responsive';
import type { NotificationItem } from '@/lib/types';

function formatDateTime(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function NotificationList({ onSelect }: { onSelect: (item: NotificationItem) => void }) {
  const { data: notifications = [], isLoading } = useNotifications(true);
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between px-1">
        <Text className="text-sm font-semibold text-slate-900">알림</Text>
        {notifications.some((n) => !n.read) ? (
          <Pressable onPress={() => markAllRead.mutate()} hitSlop={8}>
            <Text className="text-xs font-medium text-primary">모두 읽음</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator className="py-6" />
      ) : notifications.length === 0 ? (
        <Text className="px-1 py-6 text-center text-sm text-slate-400">알림이 없어요.</Text>
      ) : (
        <ScrollView className="max-h-[360px]">
          <View className="gap-1.5">
            {notifications.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onSelect(item)}
                className={`gap-0.5 rounded-xl p-3 ${item.read ? '' : 'bg-primary-light'}`}>
                <Text className="text-sm font-medium text-slate-900" numberOfLines={1}>
                  {item.title}
                </Text>
                {item.body ? (
                  <Text className="text-xs text-slate-500" numberOfLines={2}>
                    {item.body}
                  </Text>
                ) : null}
                <Text className="mt-0.5 text-[11px] text-slate-400">{formatDateTime(item.createdAt)}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/** 헤더의 알림 벨 — 데스크톱에서는 아이콘 아래로 드롭다운 패널을, 모바일에서는 하단 시트를 띄운다.
 * 기능 요청에 답변이 달리거나, 같은 가계부의 다른 구성원이 거래를 등록하면 여기로 알림이 온다. */
export function NotificationBell({ color = '#02007D' }: { color?: string }) {
  const [open, setOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();

  const handleSelect = (item: NotificationItem) => {
    if (!item.read) markRead.mutate(item.id);
    setOpen(false);
    if (item.link) router.push(item.link as never);
  };

  return (
    <View>
      <Pressable onPress={() => setOpen(true)} hitSlop={8} className="h-10 w-10 items-center justify-center">
        <Ionicons name="notifications-outline" size={22} color={color} />
        {unreadCount > 0 ? (
          <View className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-secondary" />
        ) : null}
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/10" onPress={() => setOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className={
              isDesktop
                ? 'absolute right-8 top-24 w-[340px] rounded-2xl bg-white p-3 shadow-lg shadow-slate-300'
                : 'absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-4 pb-8'
            }>
            {!isDesktop ? (
              <View className="items-center pb-2">
                <View className="h-1 w-10 rounded-full bg-slate-200" />
              </View>
            ) : null}
            <NotificationList onSelect={handleSelect} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
