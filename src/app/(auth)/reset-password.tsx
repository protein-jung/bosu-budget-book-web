import { useMutation } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
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

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const goHome = useGoHome();

  const resetMutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast.success('비밀번호가 변경되었어요. 다시 로그인해주세요.');
      router.replace('/login');
    },
    onError: (err) => toast.error(getErrorMessage(err, '비밀번호 재설정에 실패했습니다.')),
  });

  const handleSubmit = () => {
    if (!token) {
      toast.error('유효하지 않은 링크입니다. 다시 요청해주세요.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }
    resetMutation.mutate({ token, newPassword });
  };

  return (
    <>
      <Head>
        <title>비밀번호 재설정 | 보수가계부 (BOSU Ledger)</title>
        <meta name="description" content="새 비밀번호를 설정하세요." />
      </Head>
      <Screen footer>
        <View className="mt-16 gap-1">
          <Pressable onPress={goHome} className="self-start">
            <Text className="font-brand text-3xl text-primary dark:text-secondary">BOSU Ledger</Text>
          </Pressable>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">비밀번호 재설정</Text>
          <Text className="text-base text-slate-500 dark:text-slate-400">새 비밀번호를 입력해주세요.</Text>
        </View>

        {!token ? (
          <View className="gap-2 rounded-xl bg-primary-light p-4 dark:bg-slate-800">
            <Text className="text-sm leading-6 text-slate-700 dark:text-slate-200">
              링크가 유효하지 않아요. 비밀번호 찾기를 다시 요청해주세요.
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            <TextField
              label="새 비밀번호"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="8자 이상"
            />
            <TextField
              label="새 비밀번호 확인"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="한 번 더 입력해주세요"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <Button title="비밀번호 변경" onPress={handleSubmit} loading={resetMutation.isPending} />
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
