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

const BIRTH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: async (data) => {
      await setSession(data.accessToken, {
        id: data.userId,
        email: data.email,
        name: data.name,
        birthDate: data.birthDate,
      });
      router.replace('/calendar');
    },
    onError: (err) => setError(getErrorMessage(err, '회원가입에 실패했습니다.')),
  });

  const handleSubmit = () => {
    setError(null);
    if (!name || !email || !password || !birthDate) {
      setError('모든 항목을 입력해주세요.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (!BIRTH_DATE_PATTERN.test(birthDate) || Number.isNaN(new Date(birthDate).getTime())) {
      setError('생년월일은 YYYY-MM-DD 형식으로 입력해주세요.');
      return;
    }
    signupMutation.mutate({ name, email, password, birthDate });
  };

  return (
    <Screen>
      <View className="mt-16 gap-1">
        <Pressable onPress={() => router.push('/welcome')} className="mb-1 self-start">
          <Text className="text-sm font-semibold text-primary dark:text-secondary">보수가계부</Text>
        </Pressable>
        <Text className="text-3xl font-bold text-slate-900 dark:text-white">회원가입</Text>
        <Text className="text-base text-slate-500 dark:text-slate-400">보수가계부를 시작해보세요</Text>
      </View>

      <View className="gap-4">
        <TextField label="이름" value={name} onChangeText={setName} placeholder="홍길동" />
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
        <TextField
          label="생년월일"
          value={birthDate}
          onChangeText={setBirthDate}
          keyboardType="numbers-and-punctuation"
          placeholder="YYYY-MM-DD"
        />
        {error ? <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text> : null}
        <Button title="회원가입" onPress={handleSubmit} loading={signupMutation.isPending} />
      </View>

      <View className="flex-row justify-center gap-1">
        <Text className="text-slate-500 dark:text-slate-400">이미 계정이 있으신가요?</Text>
        <Link href="/login" className="font-semibold text-primary dark:text-secondary">
          로그인
        </Link>
      </View>
    </Screen>
  );
}
