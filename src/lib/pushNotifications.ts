import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let handlerConfigured = false;

/** 앱이 켜져 있을 때도(포그라운드) 알림 배너를 띄우게 한다. 웹 정적 export(Node.js) 시점에
 * 모듈 최상단에서 바로 실행되면 안 되므로, 실제로 토큰을 받아올 때(getExpoPushToken) 딱
 * 한 번만 지연 호출한다. */
function ensureHandlerConfigured() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** 실기기에서 알림 권한을 요청하고 Expo 푸시 토큰을 받아온다. 웹/시뮬레이터, 권한 거부,
 * 오류 상황에서는 조용히 null을 반환한다 — 푸시는 있으면 좋은 부가 기능이라 실패해도
 * 로그인 등 다른 화면 흐름을 막으면 안 된다. */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;
  ensureHandlerConfigured();

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let status = existingStatus;
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return null;

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}
