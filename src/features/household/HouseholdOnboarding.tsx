import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { getErrorMessage } from '@/lib/apiClient';
import { toast } from '@/store/toastStore';

import { useCreateHousehold, useJoinHousehold } from './api';

export function HouseholdOnboarding() {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const createHousehold = useCreateHousehold();
  const joinHousehold = useJoinHousehold();

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('가계부 이름을 입력해주세요.');
      return;
    }
    createHousehold.mutate(
      { name: name.trim() },
      {
        onSuccess: () => toast.success('가계부를 만들었어요.'),
        onError: (err) => toast.error(getErrorMessage(err, '가계부 생성에 실패했습니다.')),
      },
    );
  };

  const handleJoin = () => {
    if (!inviteCode.trim()) {
      toast.error('초대 코드를 입력해주세요.');
      return;
    }
    joinHousehold.mutate(
      { inviteCode: inviteCode.trim().toUpperCase() },
      {
        onSuccess: () => toast.success('가계부에 참여했어요.'),
        onError: (err) => toast.error(getErrorMessage(err, '가계부 참여에 실패했습니다.')),
      },
    );
  };

  return (
    <Screen>
      <View className="mt-12 gap-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">가계부 시작하기</Text>
        <Text className="text-base text-slate-500 dark:text-slate-400">
          새 가계부를 만들거나, 배우자가 보낸 초대 코드로 참여하세요.
        </Text>
      </View>

      <View className="flex-row gap-2 rounded-xl bg-slate-200 p-1 dark:bg-slate-800">
        <View className="flex-1">
          <Button
            title="가계부 만들기"
            variant={mode === 'create' ? 'primary' : 'secondary'}
            onPress={() => setMode('create')}
          />
        </View>
        <View className="flex-1">
          <Button
            title="초대 코드로 참여"
            variant={mode === 'join' ? 'primary' : 'secondary'}
            onPress={() => setMode('join')}
          />
        </View>
      </View>

      {mode === 'create' ? (
        <View className="gap-4">
          <TextField
            label="가계부 이름"
            value={name}
            onChangeText={setName}
            placeholder="예) 보수부부 가계부"
          />
          <Button title="만들기" onPress={handleCreate} loading={createHousehold.isPending} />
        </View>
      ) : (
        <View className="gap-4">
          <TextField
            label="초대 코드"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            placeholder="예) JZ3YZWMH"
          />
          <Button title="참여하기" onPress={handleJoin} loading={joinHousehold.isPending} />
        </View>
      )}
    </Screen>
  );
}
