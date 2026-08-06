import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f8fafc' },
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="index" options={{ title: '설정' }} />
      <Stack.Screen name="categories" options={{ title: '카테고리 관리' }} />
      <Stack.Screen name="cards" options={{ title: '카드 관리' }} />
      <Stack.Screen name="household" options={{ title: '가계부 정보' }} />
    </Stack>
  );
}
