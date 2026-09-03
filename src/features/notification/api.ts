import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import type { NotificationItem } from '@/lib/types';

const POLL_INTERVAL_MS = 30_000;

const notificationApi = {
  getAll: () => apiClient.get<NotificationItem[]>('/api/notifications').then((res) => res.data),
  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/api/notifications/unread-count').then((res) => res.data.count),
  markRead: (id: number) => apiClient.post<void>(`/api/notifications/${id}/read`).then((res) => res.data),
  markAllRead: () => apiClient.post<void>('/api/notifications/read-all').then((res) => res.data),
};

export const NOTIFICATION_QUERY_KEY = ['notifications'];
export const NOTIFICATION_UNREAD_COUNT_QUERY_KEY = ['notifications', 'unread-count'];

export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEY,
    queryFn: notificationApi.getAll,
    enabled,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: NOTIFICATION_UNREAD_COUNT_QUERY_KEY,
    queryFn: notificationApi.getUnreadCount,
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_UNREAD_COUNT_QUERY_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_UNREAD_COUNT_QUERY_KEY });
    },
  });
}
