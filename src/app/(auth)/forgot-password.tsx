import { useMutation } from '@tanstack/react-query';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { authApi } from '@/features/auth/api';
import { getErrorMessage } from '@/lib/apiClient';
import { useGoHome } from '@/lib/useGoHome';
import { toast } from '@/store/toastStore';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const goHome = useGoHome();

  const requestMutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => setSent(true),
    onError: (err) => toast.error(getErrorMessage(err, '요청 처리 중 오류가 발생했습니다.')),
  });

  const handleSubmit = () => {
    if (!email) {
      toast.error('이메일을 입력해주세요.');
      return;
    }
    requestMutation.mutate({ email });
  };

  return (
    <>
      <Head>
        <title>비밀번호 찾기 | 보수가계부 (BOSU Ledger)</title>
        <meta name="description" content="가입한 이메일로 비밀번호 재설정 링크를 받아보세요." />
      </Head>
      <Screen footer>
        <View className="mt-16 gap-1">
          <Pressable onPress={goHome} className="self-start">
            <Text className="font-brand text-3xl text-primary dark:text-secondary">BOSU Ledger</Text>
          </Pressable>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">비밀번호 찾기</Text>
          <Text className="text-base text-slate-500 dark:text-slate-400">
            가입한 이메일로 재설정 링크를 보내드려요.
          </Text>
        </View>

        {sent ? (
          <View className="gap-2 rounded-xl bg-primary-light p-4 dark:bg-slate-800">
            <Text className="text-sm leading-6 text-slate-700 dark:text-slate-200">
              입력하신 이메일로 가입된 계정이 있다면, 비밀번호 재설정 링크를 보내드렸어요 (30분간
              유효). 메일함을 확인해주세요.
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            <TextField
              label="이메일"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <Button title="재설정 링크 보내기" onPress={handleSubmit} loading={requestMutation.isPending} />
          </View>
        )}

        <View className="flex-row justify-center gap-1">
          <Link href="/login" className="text-sm font-semibold text-primary dark:text-secondary">
            로그인으로 돌아가기
          </Link>
        </View>
      </Screen>
    </>
  );
}
