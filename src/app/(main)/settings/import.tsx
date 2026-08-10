import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { useCards } from '@/features/card/api';
import { useImportStatement } from '@/features/imports/api';
import { getErrorMessage } from '@/lib/apiClient';
import { formatKrw } from '@/lib/format';
import type { ImportProvider, ImportResult } from '@/lib/types';

const PROVIDERS: { value: ImportProvider; label: string }[] = [
  { value: 'SAMSUNG_CARD', label: '삼성카드' },
  { value: 'GYEONGGI_LOCAL_CURRENCY', label: '경기지역화폐' },
];

const STATEMENT_MIME_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export default function ImportScreen() {
  const [provider, setProvider] = useState<ImportProvider>('SAMSUNG_CARD');
  const [cardId, setCardId] = useState<number | null>(null);
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const { data: cards = [] } = useCards();
  const importStatement = useImportStatement();

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
    <Screen>
      <View className="gap-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">명세서 가져오기</Text>
        <Text className="text-base text-slate-500 dark:text-slate-400">
          카드사 명세서 엑셀 파일을 올리면 거래 내역이 자동으로 등록돼요. 카테고리는 일단 '미분류'로
          들어가니 나중에 달력에서 정리해주세요.
        </Text>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">카드사</Text>
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
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">등록할 카드 (선택)</Text>
        <View className="flex-row flex-wrap gap-2">
          <Chip label="자동" selected={cardId === null} onPress={() => setCardId(null)} />
          {cards.map((card) => (
            <Chip key={card.id} label={card.name} selected={cardId === card.id} onPress={() => setCardId(card.id)} />
          ))}
        </View>
        <Text className="text-xs text-slate-400">선택하지 않으면 카드사 이름의 카드를 자동으로 찾거나 만들어요.</Text>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">파일</Text>
        <Button
          title={pickedFile ? pickedFile.name : '엑셀 파일 선택'}
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
