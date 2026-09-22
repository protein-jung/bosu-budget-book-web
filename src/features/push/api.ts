import { apiClient } from '@/lib/apiClient';

export const pushTokenApi = {
  register: (token: string) => apiClient.post<void>('/api/push-tokens', { token }),
  unregister: (token: string) => apiClient.delete<void>('/api/push-tokens', { data: { token } }),
};
