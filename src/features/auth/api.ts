import { apiClient } from '@/lib/apiClient';

export type TokenResponse = {
  accessToken: string;
  userId: number;
  email: string;
  name: string;
  birthDate: string | null;
};

export const authApi = {
  signup: (data: { email: string; password: string; name: string; birthDate: string }) =>
    apiClient.post<TokenResponse>('/api/auth/signup', data).then((res) => res.data),
  login: (data: { email: string; password: string }) =>
    apiClient.post<TokenResponse>('/api/auth/login', data).then((res) => res.data),
};
