import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { useCards } from '@/features/card/api';
import { useImportStatement } from '@/features/imports/api';
import { UncategorizedReviewTab } from '@/features/merchantRules/UncategorizedReviewTab';
import { getErrorMessage } from '@/lib/apiClient';
import { formatKrw } from '@/lib/format';
import { useIsDesktop } from '@/lib/responsive';
import type { ImportProvider, ImportResult } from '@/lib/types';
import { toast } from '@/store/toastStore';

type Tab = 'IMPORT' | 'REVIEW';
type UiProvider = ImportProvider | 'NAVER_PAY';

const PROVIDERS: { value: UiProvider; label: string }[] = [
  { value: 'SAMSUNG_CARD', label: '삼성카드' },
  { value: 'GYEONGGI_LOCAL_CURRENCY', label: '경기지역화폐' },
  { value: 'COUPANG', label: '쿠팡' },
  { value: 'KBANK', label: '케이뱅크' },
  { value: 'NAVER_PAY', label: '네이버페이' },
];

const COUPANG_EXTENSION_URL =
  'https://chromewebstore.google.com/detail/%EC%BF%A0%ED%8C%A1-%EA%B2%B0%EC%A0%9C%EB%82%B4%EC%97%AD-%EC%B6%94%EC%B6%9C/fdcblndkbmcbfgpgohnbhlnkobaiablb';

const STATEMENT_MIME_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/comma-separated-values',
  'application/pdf',
];

export default function ImportScreen() {
  const [tab, setTab] = useState<Tab>('IMPORT');
  const [provider, setProvider] = useState<UiProvider>('SAMSUNG_CARD');
  const [cardId, setCardId] = useState<number | null>(null);
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const { data: cards = [] } = useCards();
  const importStatement = useImportStatement();
  const isDesktop = useIsDesktop();

  const handlePickFile = async () => {
    setResult(null);
    const pickerResult = await DocumentPicker.getDocumentAsync({ type: STATEMENT_MIME_TYPES });
    if (pickerResult.canceled || !pickerResult.assets?.[0]) {
      return;
    }
    setPickedFile(pickerResult.assets[0]);
  };

  const handleUpload = () => {
    if (provider === 'NAVER_PAY') return;
    if (!pickedFile) {
      toast.error('먼저 파일을 선택해주세요.');
      return;
    }
    importStatement.mutate(
      { provider, file: pickedFile, cardId },
      {
        onSuccess: (data) => {
          toast.success(`${data.importedCount}건을 가져왔어요.`);
          setResult(data);
          setPickedFile(null);
        },
        onError: (err) => toast.error(getErrorMessage(err, '가져오기에 실패했습니다.')),
      },
    );
  };

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[680px]' : 'max-w-[480px]'}>
      <View className="gap-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">명세서 가져오기</Text>
        <Text className="text-base text-slate-500 dark:text-slate-400">
          명세서·주문내역 파일을 올리면 거래 내역이 자동으로 등록돼요. 카테고리는 가맹점 이름을 보고
          자동으로 나누고, 못 찾으면 미분류로 들어가요.
        </Text>
      </View>

      <View className="flex-row gap-6 border-b border-slate-200 dark:border-slate-800">
        <Pressable
          onPress={() => setTab('IMPORT')}
          className={`border-b-2 pb-2.5 ${tab === 'IMPORT' ? 'border-primary' : 'border-transparent'}`}>
          <Text
            className={
              tab === 'IMPORT' ? 'text-sm font-semibold text-primary' : 'text-sm text-slate-500 dark:text-slate-400'
            }>
            가져오기
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('REVIEW')}
          className={`border-b-2 pb-2.5 ${tab === 'REVIEW' ? 'border-primary' : 'border-transparent'}`}>
          <Text
            className={
              tab === 'REVIEW' ? 'text-sm font-semibold text-primary' : 'text-sm text-slate-500 dark:text-slate-400'
            }>
            미분류 정리
          </Text>
        </Pressable>
      </View>

      {tab === 'REVIEW' ? <UncategorizedReviewTab /> : null}

      {tab === 'IMPORT' ? (
        <>
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
            {provider === 'SAMSUNG_CARD' ? (
              <Text className="text-xs text-slate-400">
                삼성카드 홈페이지나 앱에서 이용대금 명세서 또는 카드이용내역조회 엑셀을 다운로드해서 그대로
                올리면 돼요.
              </Text>
            ) : null}
            {provider === 'GYEONGGI_LOCAL_CURRENCY' ? (
              <Text className="text-xs text-slate-400">
                앱에서 이용내역을 엑셀로 내려받아서 그대로 올리면 돼요. 암호가 걸린 파일도 그대로 올리면
                돼요 — 마이페이지에 등록된 생년월일로 자동으로 풀어요.
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
            {provider === 'KBANK' ? (
              <Text className="text-xs text-slate-400">
                케이뱅크 앱에서 받은 이용대금명세서(PDF) 또는 계좌 거래내역(엑셀)을 그대로 올리면 돼요.
                거래내역 엑셀은 입금금액은 수입으로, 출금금액은 지출로 등록되고 적요내용이 메모로 들어가요.
                암호가 걸린 엑셀도 그대로 올리면 돼요 — 마이페이지에 등록된 생년월일로 자동으로 풀어요.
              </Text>
            ) : null}
            {provider === 'NAVER_PAY' ? (
              <Text className="text-xs text-slate-400">네이버페이 연동은 준비 중이에요. 곧 안내해드릴게요.</Text>
            ) : null}
          </View>

          {provider !== 'NAVER_PAY' ? (
            <View className="gap-2">
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">등록할 카드 (선택)</Text>
              <View className="flex-row flex-wrap gap-2">
                <Chip label="자동" selected={cardId === null} onPress={() => setCardId(null)} />
                {cards.map((card) => (
                  <Chip
                    key={card.id}
                    label={card.name}
                    selected={cardId === card.id}
                    onPress={() => setCardId(card.id)}
                  />
                ))}
              </View>
              <Text className="text-xs text-slate-400">선택하지 않으면 출처 이름의 카드를 자동으로 찾거나 만들어요.</Text>
            </View>
          ) : null}

          {provider !== 'NAVER_PAY' ? (
            <>
              <View className="gap-2">
                <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">파일</Text>
                <Button
                  title={pickedFile ? pickedFile.name : '파일 선택'}
                  variant="secondary"
                  onPress={handlePickFile}
                />
              </View>

              <Button
                title="가져오기"
                onPress={handleUpload}
                loading={importStatement.isPending}
                disabled={!pickedFile}
              />
            </>
          ) : null}

          {result ? (
            <View className="gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
              <View className="gap-1">
                <Text className="text-base font-semibold text-slate-900 dark:text-white">가져오기 완료</Text>
                <Text className="text-slate-700 dark:text-slate-200">
                  {result.importedCount}건 등록 · 총 {formatKrw(result.totalAmount)} · 카드: {result.cardName}
                </Text>
                {result.skippedCount > 0 ? (
                  <Text className="text-xs text-amber-600 dark:text-amber-400">
                    이미 등록된 것과 같은 날짜·금액·가맹점 거래 {result.skippedCount}건은 중복으로 보고
                    건너뛰었어요.
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
        </>
      ) : null}
    </Screen>
  );
}
