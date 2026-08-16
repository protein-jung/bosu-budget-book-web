import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAdminLogin } from '@/features/admin/api';
import { getErrorMessage } from '@/lib/apiClient';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export default function AdminLoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const setToken = useAdminAuthStore((state) => state.setToken);
  const loginMutation = useAdminLogin();

  const handleSubmit = () => {
    setError(null);
    if (!username || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    loginMutation.mutate(
      { username, password },
      {
        onSuccess: async (data) => {
          await setToken(data.accessToken);
          router.replace('/admin');
        },
        onError: (err) => setError(getErrorMessage(err, '로그인에 실패했습니다.')),
      },
    );
  };

  return (
    <View className="flex-1 items-center justify-center bg-slate-950 p-5">
      <View className="w-full max-w-[380px] gap-6">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-white">보수가계부 관리자</Text>
          <Text className="text-sm text-slate-400">관리자 계정으로 로그인하세요</Text>
        </View>

        <View className="gap-4 rounded-xl bg-slate-900 p-5">
          <TextField
            label="아이디"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="admin"
          />
          <TextField
            label="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="비밀번호"
          />
          {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
          <Button title="로그인" onPress={handleSubmit} loading={loginMutation.isPending} />
        </View>
      </View>
    </View>
  );
}
