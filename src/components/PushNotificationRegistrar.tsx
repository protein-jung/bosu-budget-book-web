import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { pushTokenApi } from '@/features/push/api';
import { getExpoPushToken } from '@/lib/pushNotifications';
import { useAuthStore } from '@/store/authStore';

/** 로그인 상태에 맞춰 Expo 푸시 토큰을 등록/해제한다. RootLayout에 한 번만 마운트한다.
 * 로그인하면 토큰을 받아 서버에 등록하고, 로그아웃하면(이 기기가 계속 남의 알림을 받지
 * 않도록) 등록했던 토큰을 지운다. 웹 푸시는 다루지 않으므로 네이티브(iOS/Android)에서만
 * 동작한다. 화면에는 아무 것도 렌더링하지 않는다. */
export function PushNotificationRegistrar() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!accessToken) {
      const token = registeredTokenRef.current;
      if (token) {
        registeredTokenRef.current = null;
        pushTokenApi.unregister(token).catch(() => {});
      }
      return;
    }
    getExpoPushToken().then((token) => {
      if (!token) return;
      registeredTokenRef.current = token;
      pushTokenApi.register(token).catch(() => {});
    });
  }, [accessToken]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const link = response.notification.request.content.data?.link;
      if (typeof link === 'string') {
        router.push(link as never);
      }
    });
    return () => subscription.remove();
  }, []);

  return null;
}
