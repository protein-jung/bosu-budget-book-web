import axios from 'axios';
import { Platform } from 'react-native';

import { useAuthStore } from '@/store/authStore';

const BACKEND_PORT = 8080;

/**
 * 웹에서는 프론트를 접속한 호스트(예: localhost, 192.168.x.x, Tailscale IP)를 그대로
 * 재사용해 백엔드 포트로 붙는다. 같은 맥에서 프론트/백엔드를 함께 띄우는 구조라 이렇게
 * 하면 로컬/사설망/Tailscale 어디서 접속하든 별도 설정 없이 동작한다.
 */
function resolveDefaultApiBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}`;
  }
  return `http://localhost:${BACKEND_PORT}`;
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? resolveDefaultApiBaseUrl();

export const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback = '요청 처리 중 오류가 발생했습니다.'): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  return fallback;
}
