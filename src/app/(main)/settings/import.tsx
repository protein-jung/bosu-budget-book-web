import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { useCards } from '@/features/card/api';
import { useImportStatement } from '@/features/imports/api';
import { getErrorMessage } from '@/lib/apiClient';
import { formatKrw } from '@/lib/format';
import { useIsDesktop } from '@/lib/responsive';
import type { ImportProvider, ImportResult } from '@/lib/types';

const PROVIDERS: { value: ImportProvider; label: string }[] = [
  { value: 'SAMSUNG_CARD', label: '삼성카드' },
  { value: 'GYEONGGI_LOCAL_CURRENCY', label: '경기지역화폐' },
  { value: 'COUPANG', label: '쿠팡' },
];

const COUPANG_EXTENSION_URL =
  'https://chromewebstore.google.com/detail/%EC%BF%A0%ED%8C%A1-%EA%B2%B0%EC%A0%9C%EB%82%B4%EC%97%AD-%EC%B6%94%EC%B6%9C/fdcblndkbmcbfgpgohnbhlnkobaiablb';

const STATEMENT_MIME_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/comma-separated-values',
];

export default function ImportScreen() {
  const [provider, setProvider] = useState<ImportProvider>('SAMSUNG_CARD');
  const [cardId, setCardId] = useState<number | null>(null);
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const { data: cards = [] } = useCards();
  const importStatement = useImportStatement();
  const isDesktop = useIsDesktop();

  const handlePickFile = async () => {
    setError(null);
    setResult(null);
    const pickerResult = await DocumentPicker.getDocumentAsync({ type: STATEMENT_MIME_TYPES });
    if (pickerResult.canceled || !pickerResult.assets?.[0]) {
      return;
    }
    setPickedFile(pickerResult.assets[0]);
  };

  const handleUpload = () => {
    if (!pickedFile) {
      setError('먼저 파일을 선택해주세요.');
      return;
    }
    setError(null);
    importStatement.mutate(
      { provider, file: pickedFile, cardId },
      {
        onSuccess: (data) => {
          setResult(data);
          setPickedFile(null);
        },
        onError: (err) => setError(getErrorMessage(err, '가져오기에 실패했습니다.')),
      },
    );
  };

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[680px]' : 'max-w-[480px]'}>
      <View className="gap-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">명세서 가져오기</Text>
        <Text className="text-base text-slate-500 dark:text-slate-400">
          명세서·주문내역 파일을 올리면 거래 내역이 자동으로 등록돼요. 카테고리는 일단 '미분류'로
          들어가니 나중에 달력에서 정리해주세요.
        </Text>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">출처</Text>
        <View className="flex-row flex-wrap gap-2">
          {PROVIDERS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={provider === option.value}
              onPress={() => setProvider(option.value)}
            />
          ))}
        </View>
        {provider === 'GYEONGGI_LOCAL_CURRENCY' ? (
          <Text className="text-xs text-slate-400">
            암호가 걸린 파일도 그대로 올리면 돼요. 마이페이지에 등록된 생년월일로 자동으로 풀어요.
          </Text>
        ) : null}
        {provider === 'COUPANG' ? (
          <View className="gap-1">
            <Text className="text-xs text-slate-400">
              쿠팡은 주문내역을 CSV로 직접 안 줘서, 크롬 확장 프로그램을 먼저 설치해야 해요. 아래 확장
              프로그램으로 뽑은 CSV 파일을 올리면 상품 하나하나가 각각의 거래로 등록되고, 취소·반품된
              상품은 자동으로 제외돼요.
            </Text>
            <Pressable onPress={() => Linking.openURL(COUPANG_EXTENSION_URL)}>
              <Text className="text-xs font-medium text-blue-600 underline dark:text-blue-400">
                쿠팡 결제내역 추출 (크롬 확장 프로그램) 열기
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">등록할 카드 (선택)</Text>
        <View className="flex-row flex-wrap gap-2">
          <Chip label="자동" selected={cardId === null} onPress={() => setCardId(null)} />
          {cards.map((card) => (
            <Chip key={card.id} label={card.name} selected={cardId === card.id} onPress={() => setCardId(card.id)} />
          ))}
        </View>
        <Text className="text-xs text-slate-400">선택하지 않으면 출처 이름의 카드를 자동으로 찾거나 만들어요.</Text>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">파일</Text>
        <Button
          title={pickedFile ? pickedFile.name : '파일 선택'}
          variant="secondary"
          onPress={handlePickFile}
        />
      </View>

      {error ? <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text> : null}

      <Button
        title="가져오기"
        onPress={handleUpload}
        loading={importStatement.isPending}
        disabled={!pickedFile}
      />

      {result ? (
        <View className="gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
          <View className="gap-1">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">가져오기 완료</Text>
            <Text className="text-slate-700 dark:text-slate-200">
              {result.importedCount}건 등록 · 총 {formatKrw(result.totalAmount)} · 카드: {result.cardName}
            </Text>
            {result.skippedCount > 0 ? (
              <Text className="text-xs text-amber-600 dark:text-amber-400">
                이미 등록된 것과 같은 날짜·금액·가맹점 거래 {result.skippedCount}건은 중복으로 보고 건너뛰었어요.
              </Text>
            ) : null}
            <Text className="text-xs text-slate-400">카테고리는 가맹점 이름을 보고 자동으로 나눴어요.</Text>
          </View>
          <View className="gap-1.5">
            {result.categoryBreakdown.map((item) => (
              <View key={item.categoryId} className="flex-row justify-between">
                <Text className="text-sm text-slate-700 dark:text-slate-200">
                  {item.categoryName} ({item.count}건)
                </Text>
                <Text className="text-sm font-medium text-slate-900 dark:text-white">
                  {formatKrw(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
