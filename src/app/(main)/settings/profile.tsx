import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useMe, useUpdateMe, type UserProfile } from '@/features/user/api';
import { getErrorMessage } from '@/lib/apiClient';
import { useIsDesktop } from '@/lib/responsive';
import { useAuthStore } from '@/store/authStore';

const BIRTH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function ProfileScreen() {
  const { data: me } = useMe();

  if (!me) return null;

  return <ProfileForm me={me} />;
}

function ProfileForm({ me }: { me: UserProfile }) {
  const updateUser = useAuthStore((state) => state.updateUser);
  const authUser = useAuthStore((state) => state.user);
  const updateMeMutation = useUpdateMe();

  const [birthDate, setBirthDate] = useState(me.birthDate ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isDesktop = useIsDesktop();

  const handleSubmit = () => {
    setError(null);
    setSaved(false);
    if (!BIRTH_DATE_PATTERN.test(birthDate) || Number.isNaN(new Date(birthDate).getTime())) {
      setError('생년월일은 YYYY-MM-DD 형식으로 입력해주세요.');
      return;
    }
    updateMeMutation.mutate(
      { birthDate },
      {
        onSuccess: async (updated) => {
          if (authUser) {
            await updateUser({ ...authUser, birthDate: updated.birthDate });
          }
          setSaved(true);
        },
        onError: (err) => setError(getErrorMessage(err, '생년월일 수정에 실패했습니다.')),
      },
    );
  };

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[680px]' : 'max-w-[480px]'}>
      <View className="gap-1">
        <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">이름</Text>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">{me.name}</Text>
      </View>

      <View className="gap-1">
        <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">이메일</Text>
        <Text className="text-base text-slate-700 dark:text-slate-300">{me.email}</Text>
      </View>

      <View className={`gap-4 rounded-xl bg-white p-4 dark:bg-slate-900 ${isDesktop ? 'max-w-[360px]' : ''}`}>
        <TextField
          label="생년월일"
          value={birthDate}
          onChangeText={setBirthDate}
          keyboardType="numbers-and-punctuation"
          placeholder="YYYY-MM-DD"
        />
        {error ? <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text> : null}
        {saved && !error ? <Text className="text-sm text-emerald-600 dark:text-emerald-400">저장되었어요.</Text> : null}
        <Button title="저장" onPress={handleSubmit} loading={updateMeMutation.isPending} />
      </View>
    </Screen>
  );
}
