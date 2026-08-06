import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useMyHousehold } from '@/features/household/api';

const ROLE_LABEL: Record<'OWNER' | 'MEMBER', string> = {
  OWNER: '가계부 생성자',
  MEMBER: '구성원',
};

export default function HouseholdScreen() {
  const { data: household } = useMyHousehold();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!household) return;
    await Clipboard.setStringAsync(household.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!household) return null;

  return (
    <Screen>
      <View className="gap-1">
        <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">가계부 이름</Text>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">{household.name}</Text>
      </View>

      <View className="gap-2 rounded-xl bg-white p-4 dark:bg-slate-900">
        <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">초대 코드</Text>
        <Text className="text-3xl font-bold tracking-widest text-blue-600 dark:text-blue-400">
          {household.inviteCode}
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400">
          이 코드를 배우자에게 공유하면 같은 가계부에 함께 참여할 수 있어요.
        </Text>
        <Pressable onPress={handleCopy} className="items-center rounded-xl bg-blue-600 p-3">
          <Text className="font-semibold text-white">{copied ? '복사됨!' : '코드 복사하기'}</Text>
        </Pressable>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">구성원</Text>
        {household.members.map((member) => (
          <View key={member.userId} className="flex-row items-center justify-between rounded-xl bg-white p-4 dark:bg-slate-900">
            <View className="gap-0.5">
              <Text className="font-medium text-slate-900 dark:text-white">{member.name}</Text>
              <Text className="text-xs text-slate-400">{member.email}</Text>
            </View>
            <Text className="text-sm text-slate-500 dark:text-slate-400">{ROLE_LABEL[member.role]}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}
