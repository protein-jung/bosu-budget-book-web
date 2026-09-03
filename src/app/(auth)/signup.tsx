import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { authApi } from '@/features/auth/api';
import { getErrorMessage } from '@/lib/apiClient';
import { useGoHome } from '@/lib/useGoHome';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';

const BIRTH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DATE_BOX_BASE_CLASS =
  'min-w-0 rounded-xl border border-slate-300 bg-white px-2 py-3 text-center text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white';
const YEAR_BOX_CLASS = `${DATE_BOX_BASE_CLASS} flex-[3]`;
const DATE_BOX_CLASS = `${DATE_BOX_BASE_CLASS} flex-[2]`;

function BirthDateInput({
  year,
  month,
  day,
  onYearChange,
  onMonthChange,
  onDayChange,
}: {
  year: string;
  month: string;
  day: string;
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onDayChange: (value: string) => void;
}) {
  const yearRef = useRef<TextInput>(null);
  const monthRef = useRef<TextInput>(null);
  const dayRef = useRef<TextInput>(null);

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">생년월일</Text>
      <View className="flex-row items-center gap-1.5">
        <TextInput
          ref={yearRef}
          value={year}
          onChangeText={(text) => {
            const digits = text.replace(/[^0-9]/g, '').slice(0, 4);
            onYearChange(digits);
            // Deferred so this input's own controlled re-render settles before focus jumps —
            // calling focus() synchronously here races with it and can garble the next field.
            if (digits.length === 4) setTimeout(() => monthRef.current?.focus(), 0);
          }}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="YYYY"
          placeholderTextColor="#94a3b8"
          className={YEAR_BOX_CLASS}
        />
        <Text className="text-slate-400">-</Text>
        <TextInput
          ref={monthRef}
          value={month}
          onChangeText={(text) => {
            const digits = text.replace(/[^0-9]/g, '').slice(0, 2);
            onMonthChange(digits);
            if (digits.length === 2) setTimeout(() => dayRef.current?.focus(), 0);
          }}
          onKeyPress={(e) => {
            if (e.nativeEvent.key === 'Backspace' && month.length === 0) setTimeout(() => yearRef.current?.focus(), 0);
          }}
          onBlur={() => {
            if (month.length === 1) onMonthChange(month.padStart(2, '0'));
          }}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="MM"
          placeholderTextColor="#94a3b8"
          className={DATE_BOX_CLASS}
        />
        <Text className="text-slate-400">-</Text>
        <TextInput
          ref={dayRef}
          value={day}
          onChangeText={(text) => onDayChange(text.replace(/[^0-9]/g, '').slice(0, 2))}
          onKeyPress={(e) => {
            if (e.nativeEvent.key === 'Backspace' && day.length === 0) setTimeout(() => monthRef.current?.focus(), 0);
          }}
          onBlur={() => {
            if (day.length === 1) onDayChange(day.padStart(2, '0'));
          }}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="DD"
          placeholderTextColor="#94a3b8"
          className={DATE_BOX_CLASS}
        />
      </View>
    </View>
  );
}

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const goHome = useGoHome();

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: async (data) => {
      await setSession(data.accessToken, {
        id: data.userId,
        email: data.email,
        name: data.name,
        birthDate: data.birthDate,
        isAdmin: data.isAdmin,
      });
      if (data.isAdmin) {
        await useAdminAuthStore.getState().setToken(data.accessToken);
      }
      router.replace('/calendar');
    },
    onError: (err) => toast.error(getErrorMessage(err, '회원가입에 실패했습니다.')),
  });

  const handleSubmit = () => {
    const birthDate =
      birthYear.length === 4 && birthMonth && birthDay
        ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
        : '';
    if (!name || !email || !password || !birthDate) {
      toast.error('모든 항목을 입력해주세요.');
      return;
    }
    if (password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (!BIRTH_DATE_PATTERN.test(birthDate) || Number.isNaN(new Date(birthDate).getTime())) {
      toast.error('생년월일을 올바르게 입력해주세요.');
      return;
    }
    if (!agreedToTerms) {
      toast.error('이용약관 및 개인정보처리방침에 동의해주세요.');
      return;
    }
    signupMutation.mutate({ name, email, password, birthDate });
  };

  return (
    <Screen footer>
      <View className="mt-16 gap-1">
        <Pressable onPress={goHome} className="mb-1 self-start">
          <Text className="font-brand text-sm text-primary dark:text-secondary">BOSU Ledger</Text>
        </Pressable>
        <Text className="text-3xl font-bold text-slate-900 dark:text-white">회원가입</Text>
        <Text className="text-base text-slate-500 dark:text-slate-400">BOSU Ledger를 시작해보세요</Text>
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
        <BirthDateInput
          year={birthYear}
          month={birthMonth}
          day={birthDay}
          onYearChange={setBirthYear}
          onMonthChange={setBirthMonth}
          onDayChange={setBirthDay}
        />
        <Pressable
          onPress={() => setAgreedToTerms((v) => !v)}
          className="flex-row items-start gap-2.5"
          hitSlop={4}>
          <View
            className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
              agreedToTerms ? 'border-primary bg-primary' : 'border-slate-300'
            }`}>
            {agreedToTerms ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </View>
          <Text className="flex-1 text-sm text-slate-600 dark:text-slate-400">
            <Text
              onPress={(e) => {
                e.stopPropagation();
                router.push('/terms');
              }}
              className="font-medium text-primary dark:text-secondary">
              이용약관
            </Text>
            {' 및 '}
            <Text
              onPress={(e) => {
                e.stopPropagation();
                router.push('/privacy');
              }}
              className="font-medium text-primary dark:text-secondary">
              개인정보처리방침
            </Text>
            {'에 동의합니다'}
          </Text>
        </Pressable>

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
