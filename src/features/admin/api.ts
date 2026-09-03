import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminApiClient } from '@/lib/adminApiClient';
import type { AdminFeatureRequest, Transaction } from '@/lib/types';

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
  totalIncome: number;
  totalExpense: number;
  newUsersLast7Days: number;
  newHouseholdsLast7Days: number;
};

export type AdminTransaction = {
  id: number;
  transactionDate: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryName: string;
  categoryIcon: string | null;
  memo: string | null;
  userName: string | null;
  cardName: string | null;
};

export type AdminCategoryTotal = {
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  type: 'INCOME' | 'EXPENSE';
  total: number;
  count: number;
};

export type AdminMember = {
  userId: number;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
};

export type AdminHouseholdDetail = {
  id: number;
  name: string;
  inviteCode: string;
  createdAt: string;
  members: AdminMember[];
  categoryTotals: AdminCategoryTotal[];
  transactionCount: number;
};

export type AdminUserDetail = AdminUser & {
  recentTransactions: AdminTransaction[];
};

export type AdminTrendPoint = {
  date: string;
  value: number;
};

export type AdminTrends = {
  userGrowth: AdminTrendPoint[];
  dailyIncome: AdminTrendPoint[];
  dailyExpense: AdminTrendPoint[];
};

const adminApi = {
  login: (data: { username: string; password: string }) =>
    adminApiClient.post<{ accessToken: string }>('/api/admin/auth/login', data).then((res) => res.data),
  getStats: () => adminApiClient.get<AdminStats>('/api/admin/stats').then((res) => res.data),
  getTrends: (days: number) =>
    adminApiClient.get<AdminTrends>('/api/admin/trends', { params: { days } }).then((res) => res.data),
  getUsers: () => adminApiClient.get<AdminUser[]>('/api/admin/users').then((res) => res.data),
  getUserDetail: (userId: number) =>
    adminApiClient.get<AdminUserDetail>(`/api/admin/users/${userId}`).then((res) => res.data),
  getHouseholds: () => adminApiClient.get<AdminHousehold[]>('/api/admin/households').then((res) => res.data),
  getHouseholdDetail: (householdId: number) =>
    adminApiClient.get<AdminHouseholdDetail>(`/api/admin/households/${householdId}`).then((res) => res.data),
  getHouseholdTransactions: (householdId: number, year: number, month: number) =>
    adminApiClient
      .get<Transaction[]>(`/api/admin/households/${householdId}/transactions`, { params: { year, month } })
      .then((res) => res.data),
  blockUser: (userId: number) => adminApiClient.post<void>(`/api/admin/users/${userId}/block`).then((res) => res.data),
  unblockUser: (userId: number) =>
    adminApiClient.post<void>(`/api/admin/users/${userId}/unblock`).then((res) => res.data),
  deleteUser: (userId: number) => adminApiClient.delete<void>(`/api/admin/users/${userId}`).then((res) => res.data),
  getFeatureRequests: () =>
    adminApiClient.get<AdminFeatureRequest[]>('/api/admin/feature-requests').then((res) => res.data),
  replyFeatureRequest: (requestId: number, reply: string) =>
    adminApiClient
      .post<AdminFeatureRequest>(`/api/admin/feature-requests/${requestId}/reply`, { reply })
      .then((res) => res.data),
};

const ADMIN_USERS_QUERY_KEY = ['admin', 'users'];
const ADMIN_FEATURE_REQUESTS_QUERY_KEY = ['admin', 'feature-requests'];

export function useAdminLogin() {
  return useMutation({ mutationFn: adminApi.login });
}

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.getStats });
}

export function useAdminTrends(days = 30) {
  return useQuery({ queryKey: ['admin', 'trends', days], queryFn: () => adminApi.getTrends(days) });
}

export function useAdminUsers() {
  return useQuery({ queryKey: ADMIN_USERS_QUERY_KEY, queryFn: adminApi.getUsers });
}

export function useAdminUserDetail(userId: number) {
  return useQuery({ queryKey: ['admin', 'users', userId], queryFn: () => adminApi.getUserDetail(userId) });
}

export function useAdminHouseholds() {
  return useQuery({ queryKey: ['admin', 'households'], queryFn: adminApi.getHouseholds });
}

export function useAdminHouseholdDetail(householdId: number) {
  return useQuery({
    queryKey: ['admin', 'households', householdId],
    queryFn: () => adminApi.getHouseholdDetail(householdId),
  });
}

export function useAdminHouseholdTransactions(householdId: number, year: number, month: number) {
  return useQuery({
    queryKey: ['admin', 'households', householdId, 'transactions', year, month],
    queryFn: () => adminApi.getHouseholdTransactions(householdId, year, month),
  });
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

export function useAdminFeatureRequests() {
  return useQuery({ queryKey: ADMIN_FEATURE_REQUESTS_QUERY_KEY, queryFn: adminApi.getFeatureRequests });
}

export function useReplyFeatureRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, reply }: { requestId: number; reply: string }) =>
      adminApi.replyFeatureRequest(requestId, reply),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_FEATURE_REQUESTS_QUERY_KEY }),
  });
}
