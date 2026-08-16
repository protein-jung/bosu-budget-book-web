import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';

export type UserProfile = {
  id: number;
  email: string;
  name: string;
  birthDate: string | null;
};

const userApi = {
  getMe: () => apiClient.get<UserProfile>('/api/users/me').then((res) => res.data),
  updateMe: (data: { name: string; birthDate: string }) =>
    apiClient.patch<UserProfile>('/api/users/me', data).then((res) => res.data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put<void>('/api/users/me/password', data).then((res) => res.data),
  deleteAccount: (data: { password: string }) =>
    apiClient.delete<void>('/api/users/me', { data }).then((res) => res.data),
};

export const USER_ME_QUERY_KEY = ['users', 'me'];

export function useMe() {
  return useQuery({ queryKey: USER_ME_QUERY_KEY, queryFn: userApi.getMe });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.updateMe,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USER_ME_QUERY_KEY }),
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: userApi.changePassword });
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: userApi.deleteAccount });
}
