import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useChangePassword, useDeleteAccount, useMe, useUpdateMe, type UserProfile } from '@/features/user/api';
import { getErrorMessage } from '@/lib/apiClient';
import { queryClient } from '@/lib/queryClient';
import { useIsDesktop } from '@/lib/responsive';
import { useAuthStore } from '@/store/authStore';

const DATE_INPUT_CLASSNAME =
  'min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-2 py-3 text-center text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white';

const SECTION_CLASSNAME = 'gap-4 border-t border-slate-100 pt-5 dark:border-slate-800';

function onlyDigits(text: string, maxLength: number) {
  return text.replace(/[^0-9]/g, '').slice(0, maxLength);
}

export default function ProfileScreen() {
  const { data: me } = useMe();

  if (!me) return null;

  return <ProfileForm me={me} />;
}

function ProfileForm({ me }: { me: UserProfile }) {
  const isDesktop = useIsDesktop();

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[520px]' : 'max-w-[480px]'}>
      <View className="gap-5 rounded-xl bg-white p-5 dark:bg-slate-900">
        <View className="gap-1">
          <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">이메일</Text>
          <Text className="text-base text-slate-700 dark:text-slate-300">{me.email}</Text>
        </View>

        <ProfileEditForm me={me} />
        <PasswordChangeForm />
        <AccountActions />
      </View>
    </Screen>
  );
}

function ProfileEditForm({ me }: { me: UserProfile }) {
  const updateUser = useAuthStore((state) => state.updateUser);
  const authUser = useAuthStore((state) => state.user);
  const updateMeMutation = useUpdateMe();

  const [birthYearInit = '', birthMonthInit = '', birthDayInit = ''] = (me.birthDate ?? '').split('-');
  const [name, setName] = useState(me.name);
  const [birthYear, setBirthYear] = useState(birthYearInit);
  const [birthMonth, setBirthMonth] = useState(birthMonthInit);
  const [birthDay, setBirthDay] = useState(birthDayInit);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = () => {
    setError(null);
    setSaved(false);
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (birthYear.length !== 4 || !birthMonth || !birthDay) {
      setError('생년월일을 모두 입력해주세요.');
      return;
    }
    const birthDate = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
    if (Number.isNaN(new Date(birthDate).getTime())) {
      setError('생년월일을 다시 확인해주세요.');
      return;
    }
    updateMeMutation.mutate(
      { name: name.trim(), birthDate },
      {
        onSuccess: async (updated) => {
          if (authUser) {
            await updateUser({ ...authUser, name: updated.name, birthDate: updated.birthDate });
          }
          setSaved(true);
        },
        onError: (err) => setError(getErrorMessage(err, '정보 수정에 실패했습니다.')),
      },
    );
  };

  return (
    <View className={SECTION_CLASSNAME}>
      <Text className="text-base font-semibold text-slate-900 dark:text-white">내 정보</Text>
      <TextField label="이름" value={name} onChangeText={setName} placeholder="이름" />
      <View className="gap-1.5">
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">생년월일</Text>
        <View className="flex-row items-center gap-1.5">
          <TextInput
            className={DATE_INPUT_CLASSNAME}
            value={birthYear}
            onChangeText={(text) => setBirthYear(onlyDigits(text, 4))}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="YYYY"
            placeholderTextColor="#94a3b8"
          />
          <Text className="text-xs text-slate-400">년</Text>
          <TextInput
            className={DATE_INPUT_CLASSNAME}
            value={birthMonth}
            onChangeText={(text) => setBirthMonth(onlyDigits(text, 2))}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="MM"
            placeholderTextColor="#94a3b8"
          />
          <Text className="text-xs text-slate-400">월</Text>
          <TextInput
            className={DATE_INPUT_CLASSNAME}
            value={birthDay}
            onChangeText={(text) => setBirthDay(onlyDigits(text, 2))}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="DD"
            placeholderTextColor="#94a3b8"
          />
          <Text className="text-xs text-slate-400">일</Text>
        </View>
      </View>
      {error ? <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text> : null}
      {saved && !error ? <Text className="text-sm text-emerald-600 dark:text-emerald-400">저장되었어요.</Text> : null}
      <Button title="저장" onPress={handleSubmit} loading={updateMeMutation.isPending} />
    </View>
  );
}

function PasswordChangeForm() {
  const changePasswordMutation = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = () => {
    setError(null);
    setSaved(false);
    if (!currentPassword) {
      setError('현재 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword.length < 8) {
      setError('새 비밀번호는 8자 이상이어야 해요.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError('새 비밀번호가 일치하지 않아요.');
      return;
    }
    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setNewPasswordConfirm('');
          setSaved(true);
        },
        onError: (err) => setError(getErrorMessage(err, '비밀번호 변경에 실패했습니다.')),
      },
    );
  };

  return (
    <View className={SECTION_CLASSNAME}>
      <Text className="text-base font-semibold text-slate-900 dark:text-white">비밀번호 변경</Text>
      <TextField
        label="현재 비밀번호"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        placeholder="현재 비밀번호"
      />
      <TextField
        label="새 비밀번호"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        placeholder="8자 이상"
      />
      <TextField
        label="새 비밀번호 확인"
        value={newPasswordConfirm}
        onChangeText={setNewPasswordConfirm}
        secureTextEntry
        placeholder="새 비밀번호 다시 입력"
      />
      {error ? <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text> : null}
      {saved && !error ? (
        <Text className="text-sm text-emerald-600 dark:text-emerald-400">비밀번호가 변경되었어요.</Text>
      ) : null}
      <Button title="비밀번호 변경" onPress={handleSubmit} loading={changePasswordMutation.isPending} />
    </View>
  );
}

function AccountActions() {
  const logout = useAuthStore((state) => state.logout);
  const deleteAccountMutation = useDeleteAccount();

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    router.replace('/login');
  };

  const handleDeleteAccount = () => {
    setDeleteError(null);
    if (!deletePassword) {
      setDeleteError('비밀번호를 입력해주세요.');
      return;
    }
    deleteAccountMutation.mutate(
      { password: deletePassword },
      {
        onSuccess: async () => {
          await logout();
          queryClient.clear();
          router.replace('/login');
        },
        onError: (err) => setDeleteError(getErrorMessage(err, '회원 탈퇴에 실패했습니다.')),
      },
    );
  };

  return (
    <View className={SECTION_CLASSNAME}>
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-slate-900 dark:text-white">계정</Text>
        <Pressable
          onPress={handleLogout}
          className="rounded-lg bg-slate-100 px-3 py-2 active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700">
          <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">로그아웃</Text>
        </Pressable>
      </View>

      <View className="gap-3">
        <Text className="text-sm font-semibold text-red-600 dark:text-red-400">회원 탈퇴</Text>
        <Text className="text-xs text-slate-400">
          탈퇴하면 다시 로그인할 수 없어요. 작성한 거래는 가계부에 남고 작성자만 '탈퇴한 사용자'로
          표시돼요.
        </Text>
        <TextField
          label="비밀번호 확인"
          value={deletePassword}
          onChangeText={setDeletePassword}
          secureTextEntry
          placeholder="현재 비밀번호"
        />
        {deleteError ? <Text className="text-sm text-red-600 dark:text-red-400">{deleteError}</Text> : null}
        <Button
          title="탈퇴하기"
          variant="danger"
          onPress={handleDeleteAccount}
          loading={deleteAccountMutation.isPending}
        />
      </View>
    </View>
  );
}
