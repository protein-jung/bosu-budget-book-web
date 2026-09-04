import { apiClient } from '@/lib/apiClient';

export type TokenResponse = {
  accessToken: string;
  userId: number;
  email: string;
  name: string;
  birthDate: string | null;
  isAdmin: boolean;
};

export const authApi = {
  signup: (data: { email: string; password: string; name: string; birthDate: string }) =>
    apiClient.post<TokenResponse>('/api/auth/signup', data).then((res) => res.data),
  login: (data: { email: string; password: string }) =>
    apiClient.post<TokenResponse>('/api/auth/login', data).then((res) => res.data),
  forgotPassword: (data: { email: string }) => apiClient.post<void>('/api/auth/forgot-password', data),
  resetPassword: (data: { token: string; newPassword: string }) =>
    apiClient.post<void>('/api/auth/reset-password', data),
};
