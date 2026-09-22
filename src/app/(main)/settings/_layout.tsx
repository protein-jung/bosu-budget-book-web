import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

// (main) 탭 위에 이미 MobileHeader/TopNav가 있어서 안전 영역은 거기서 한 번만 챙기면 된다 —
// 여기서 또 insets.top을 더하면 그만큼 빈 공간이 두 번 생긴다.
function SettingsHeader({ options, back }: { options: { title?: string }; back?: { title?: string } }) {
  return (
    <View className="bg-cream">
      <View className="mx-auto w-full max-w-[680px] flex-row items-center px-4 py-3">
        <View className="w-9">
          {back ? (
            <Pressable onPress={() => router.back()} hitSlop={8} className="-ml-1.5 h-9 w-9 items-center justify-center">
              <Ionicons name="chevron-back" size={22} color="#0f172a" />
            </Pressable>
          ) : null}
        </View>
        <Text className="flex-1 text-center text-base font-semibold text-slate-900">{options.title}</Text>
        <View className="w-9" />
      </View>
    </View>
  );
}

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ header: (props) => <SettingsHeader {...props} /> }}>
      <Stack.Screen name="index" options={{ title: '설정' }} />
      <Stack.Screen name="profile" options={{ title: '마이페이지' }} />
      <Stack.Screen name="categories" options={{ title: '카테고리 관리' }} />
      <Stack.Screen name="cards" options={{ title: '카드 관리' }} />
      <Stack.Screen name="recurring-expenses" options={{ title: '고정비 지출' }} />
      <Stack.Screen name="household" options={{ title: '가계부 정보' }} />
      <Stack.Screen name="import" options={{ title: '명세서 가져오기' }} />
      <Stack.Screen name="feature-requests" options={{ title: '기능 요청' }} />
      <Stack.Screen name="review" options={{ title: '리뷰 남기기' }} />
    </Stack>
  );
}
