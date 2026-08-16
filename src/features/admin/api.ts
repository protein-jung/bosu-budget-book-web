import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminApiClient } from '@/lib/adminApiClient';

export type AdminUser = {
  id: number;
  email: string;
  name: string;
  birthDate: string | null;
  blocked: boolean;
  createdAt: string;
  householdId: number | null;
  householdName: string | null;
  householdRole: string | null;
  transactionCount: number;
};

export type AdminHousehold = {
  id: number;
  name: string;
  inviteCode: string;
  createdAt: string;
  memberNames: string[];
  transactionCount: number;
};

export type AdminStats = {
  totalUsers: number;
  totalHouseholds: number;
  totalTransactions: number;
  newUsersLast7Days: number;
  newHouseholdsLast7Days: number;
};

const adminApi = {
  login: (data: { username: string; password: string }) =>
    adminApiClient.post<{ accessToken: string }>('/api/admin/auth/login', data).then((res) => res.data),
  getStats: () => adminApiClient.get<AdminStats>('/api/admin/stats').then((res) => res.data),
  getUsers: () => adminApiClient.get<AdminUser[]>('/api/admin/users').then((res) => res.data),
  getHouseholds: () => adminApiClient.get<AdminHousehold[]>('/api/admin/households').then((res) => res.data),
  blockUser: (userId: number) => adminApiClient.post<void>(`/api/admin/users/${userId}/block`).then((res) => res.data),
  unblockUser: (userId: number) =>
    adminApiClient.post<void>(`/api/admin/users/${userId}/unblock`).then((res) => res.data),
  deleteUser: (userId: number) => adminApiClient.delete<void>(`/api/admin/users/${userId}`).then((res) => res.data),
};

const ADMIN_USERS_QUERY_KEY = ['admin', 'users'];

export function useAdminLogin() {
  return useMutation({ mutationFn: adminApi.login });
}

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.getStats });
}

export function useAdminUsers() {
  return useQuery({ queryKey: ADMIN_USERS_QUERY_KEY, queryFn: adminApi.getUsers });
}

export function useAdminHouseholds() {
  return useQuery({ queryKey: ['admin', 'households'], queryFn: adminApi.getHouseholds });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.blockUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY }),
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.unblockUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY }),
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY }),
  });
}
