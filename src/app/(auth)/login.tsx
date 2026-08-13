import { useMutation } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { authApi } from '@/features/auth/api';
import { getErrorMessage } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      await setSession(data.accessToken, {
        id: data.userId,
        email: data.email,
        name: data.name,
        birthDate: data.birthDate,
      });
      router.replace('/calendar');
    },
    onError: (err) => setError(getErrorMessage(err, '로그인에 실패했습니다.')),
  });

  const handleSubmit = () => {
    setError(null);
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <Screen>
      <View className="mt-16 gap-1">
        <Pressable onPress={() => router.push('/welcome')} className="self-start">
          <Text className="text-3xl font-bold text-primary dark:text-secondary">보수가계부</Text>
        </Pressable>
        <Text className="text-base text-slate-500 dark:text-slate-400">보수부부의 월급날 정산 프로그램</Text>
      </View>

      <View className="gap-4">
        <TextField
          label="이메일"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <TextField
          label="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="8자 이상"
        />
        {error ? <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text> : null}
        <Button title="로그인" onPress={handleSubmit} loading={loginMutation.isPending} />
      </View>

      <View className="flex-row justify-center gap-1">
        <Text className="text-slate-500 dark:text-slate-400">계정이 없으신가요?</Text>
        <Link href="/signup" className="font-semibold text-primary dark:text-secondary">
          회원가입
        </Link>
      </View>
    </Screen>
  );
}
