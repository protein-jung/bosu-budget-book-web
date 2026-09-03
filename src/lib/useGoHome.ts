import { router } from 'expo-router';

import { useAuthStore } from '@/store/authStore';

/** 로고를 눌렀을 때 갈 "홈" — 로그인 상태면 달력, 아니면 로그인 화면. */
export function useGoHome() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return () => router.push(accessToken ? '/calendar' : '/login');
}
