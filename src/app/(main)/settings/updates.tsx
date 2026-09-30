import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { CHANGELOG } from '@/features/changelog/entries';
import { useIsDesktop } from '@/lib/responsive';

export default function UpdatesScreen() {
  const isDesktop = useIsDesktop();

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[680px]' : 'max-w-[480px]'}>
      <Pressable
        onPress={() => router.push({ pathname: '/settings/feature-requests', params: { autoOpen: '1' } })}
        className="items-center rounded-xl bg-white p-4 dark:bg-slate-900">
        <Text className="text-sm font-medium text-primary dark:text-secondary">
          원하는 기능이 있으면 요청해주세요 — 다음 소식의 주인공이 될 수 있어요
        </Text>
      </Pressable>
      {CHANGELOG.length === 0 ? (
        <Text className="py-4 text-center text-sm text-slate-400">아직 소식이 없어요.</Text>
      ) : (
        CHANGELOG.map((entry) => (
          <View key={`${entry.date}-${entry.title}`} className="gap-1.5 rounded-xl bg-white p-4 dark:bg-slate-900">
            <Text className="text-xs text-slate-400">{entry.date}</Text>
            <Text className="text-base font-semibold text-slate-900 dark:text-white">{entry.title}</Text>
            <Text className="text-sm text-slate-600 dark:text-slate-300">{entry.description}</Text>
            {entry.requestedBy ? (
              <Text className="self-start rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
                💡 {entry.requestedBy}님의 요청으로 만들었어요
              </Text>
            ) : null}
          </View>
        ))
      )}
    </Screen>
  );
}
