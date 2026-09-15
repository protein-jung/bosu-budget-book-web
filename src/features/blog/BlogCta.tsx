import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export function BlogCta({ children }: { children: string }) {
  return (
    <View className="gap-3 rounded-2xl bg-primary-light p-5">
      <Text className="text-sm leading-6 text-slate-700">{children}</Text>
      <Pressable
        onPress={() => router.push('/welcome')}
        className="self-start rounded-xl bg-primary px-5 py-3 active:bg-primary-dark">
        <Text className="text-sm font-semibold text-white">보수가계부 무료로 시작하기 →</Text>
      </Pressable>
    </View>
  );
}
