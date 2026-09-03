import { useMutation } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { authApi } from '@/features/auth/api';
import { getErrorMessage } from '@/lib/apiClient';
import { useGoHome } from '@/lib/useGoHome';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setSession = useAuthStore((state) => state.setSession);
  const goHome = useGoHome();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      await setSession(data.accessToken, {
        id: data.userId,
        email: data.email,
        name: data.name,
        birthDate: data.birthDate,
        isAdmin: data.isAdmin,
      });
      if (data.isAdmin) {
        // 이 계정은 admin.user-email로 지정돼 있어서, 발급받은 토큰에 이미 ROLE_ADMIN 권한이
        // 같이 실려있다 — 그 토큰을 어드민 화면 쪽 스토어에도 그대로 넣어두면, 메뉴의 "관리자"
        // 버튼을 눌렀을 때 별도 로그인 없이 바로 /admin API를 쓸 수 있다. 로그인 자체는 다른
        // 계정과 똑같이 평소 화면(달력)으로 간다.
        await useAdminAuthStore.getState().setToken(data.accessToken);
      }
      router.replace('/calendar');
    },
    onError: (err) => toast.error(getErrorMessage(err, '로그인에 실패했습니다.')),
  });

  const handleSubmit = () => {
    if (!email || !password) {
      toast.error('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <Screen footer>
      <View className="mt-16 gap-1">
        <Pressable onPress={goHome} className="self-start">
          <Text className="font-brand text-3xl text-primary dark:text-secondary">BOSU Ledger</Text>
        </Pressable>
        <Text className="text-base text-slate-500 dark:text-slate-400">덜 쓰고, 더 남기고.</Text>
        <Text className="text-base font-medium text-slate-400 dark:text-slate-500">Spend less. Keep more.</Text>
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
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
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
