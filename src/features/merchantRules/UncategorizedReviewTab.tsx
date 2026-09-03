import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { useCategories } from '@/features/category/api';
import { getErrorMessage } from '@/lib/apiClient';
import { formatKrw } from '@/lib/format';
import type { MerchantCategoryRule, UncategorizedMerchant } from '@/lib/types';
import { toast } from '@/store/toastStore';

import {
  useCreateMerchantRule,
  useDeleteMerchantRule,
  useMerchantCategoryRules,
  useUncategorizedMerchants,
  useUpdateMerchantRule,
} from './api';

function merchantKey(merchant: UncategorizedMerchant): string {
  return `${merchant.type}:${merchant.merchantName}`;
}

function hasMatchingRule(merchant: UncategorizedMerchant, keywordsAcrossRules: string[][]): boolean {
  const upperName = merchant.merchantName.toUpperCase();
  return keywordsAcrossRules.some((keywords) => keywords.some((keyword) => upperName.includes(keyword.toUpperCase())));
}

function RuleEditor({
  categoryOptions,
  categoryId,
  onSelectCategory,
  keywordInput,
  onChangeKeywordInput,
  onSave,
  saving,
  onDelete,
  deleting,
}: {
  categoryOptions: { id: number; name: string; icon: string | null; color: string | null }[];
  categoryId: number | null;
  onSelectCategory: (id: number) => void;
  keywordInput: string;
  onChangeKeywordInput: (text: string) => void;
  onSave: () => void;
  saving: boolean;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  return (
    <View className="gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
      <View className="gap-2">
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">카테고리</Text>
        <View className="flex-row flex-wrap gap-2">
          {categoryOptions.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              icon={category.icon}
              color={category.color}
              selected={categoryId === category.id}
              onPress={() => onSelectCategory(category.id)}
            />
          ))}
        </View>
      </View>
      <View className="gap-2">
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">키워드</Text>
        <TextInput
          value={keywordInput}
          onChangeText={onChangeKeywordInput}
          placeholder="쉼표로 여러 개 입력할 수 있어요"
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 dark:border-slate-600 dark:text-white"
        />
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button title="저장" onPress={onSave} loading={saving} />
        </View>
        {onDelete ? (
          <View className="flex-1">
            <Button title="삭제" variant="danger" onPress={onDelete} loading={deleting} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function parseKeywords(input: string): string[] {
  return input
    .split(',')
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
}

function RuleListSection({ rules }: { rules: MerchantCategoryRule[] }) {
  const { data: categories = [] } = useCategories();
  const updateRule = useUpdateMerchantRule();
  const deleteRule = useDeleteMerchantRule();

  const [sectionOpen, setSectionOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const handleExpandRule = (rule: MerchantCategoryRule) => {
    if (editingRuleId === rule.id) {
      setEditingRuleId(null);
      return;
    }
    setEditingRuleId(rule.id);
    setKeywordInput(rule.keywords.join(', '));
    setCategoryId(rule.categoryId);
  };

  const handleSaveRule = (rule: MerchantCategoryRule) => {
    if (categoryId === null) {
      toast.error('카테고리를 선택해주세요.');
      return;
    }
    const keywords = parseKeywords(keywordInput);
    if (keywords.length === 0) {
      toast.error('키워드를 입력해주세요.');
      return;
    }
    updateRule.mutate(
      { id: rule.id, data: { categoryId, keywords } },
      {
        onSuccess: () => {
          toast.success('규칙을 수정했어요.');
          setEditingRuleId(null);
        },
        onError: (err) => toast.error(getErrorMessage(err, '규칙 수정에 실패했습니다.')),
      },
    );
  };

  const handleDeleteRule = (rule: MerchantCategoryRule) => {
    deleteRule.mutate(rule.id, {
      onSuccess: () => {
        toast.success('규칙을 삭제했어요.');
        setEditingRuleId(null);
      },
      onError: (err) => toast.error(getErrorMessage(err, '규칙 삭제에 실패했습니다.')),
    });
  };

  return (
    <View className="gap-2 rounded-xl bg-white p-4 dark:bg-slate-900">
      <Pressable className="flex-row items-center justify-between" onPress={() => setSectionOpen((v) => !v)}>
        <Text className="text-base font-medium text-slate-900 dark:text-white">
          내 규칙 목록 ({rules.length}개)
        </Text>
        <Text className="text-xs text-slate-400">{sectionOpen ? '접기' : '펼치기'}</Text>
      </Pressable>

      {sectionOpen ? (
        <View className="gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
          {rules.map((rule) => {
            const editing = editingRuleId === rule.id;
            const categoryOptions = categories.filter((c) => c.type === 'EXPENSE' && !c.isGroup);
            return (
              <View key={rule.id} className="gap-2">
                <Pressable className="flex-row items-center justify-between" onPress={() => handleExpandRule(rule)}>
                  <View className="flex-1 flex-row items-center gap-1.5">
                    {rule.icon ? <Text>{rule.icon}</Text> : null}
                    <Text className="text-sm font-medium text-slate-900 dark:text-white">{rule.categoryName}</Text>
                  </View>
                  <Text className="flex-1 text-right text-xs text-slate-500 dark:text-slate-400" numberOfLines={1}>
                    {rule.keywords.join(', ')}
                  </Text>
                </Pressable>

                {editing ? (
                  <RuleEditor
                    categoryOptions={categoryOptions}
                    categoryId={categoryId}
                    onSelectCategory={setCategoryId}
                    keywordInput={keywordInput}
                    onChangeKeywordInput={setKeywordInput}
                    onSave={() => handleSaveRule(rule)}
                    saving={updateRule.isPending}
                    onDelete={() => handleDeleteRule(rule)}
                    deleting={deleteRule.isPending}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export function UncategorizedReviewTab() {
  const { data: merchants = [], isLoading } = useUncategorizedMerchants();
  const { data: rules = [] } = useMerchantCategoryRules();
  const { data: categories = [] } = useCategories();
  const createRule = useCreateMerchantRule();

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const ruleKeywords = rules.map((rule) => rule.keywords);
  const visibleMerchants = merchants.filter((merchant) => !hasMatchingRule(merchant, ruleKeywords));

  const handleExpand = (merchant: UncategorizedMerchant) => {
    const key = merchantKey(merchant);
    if (expandedKey === key) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(key);
    setKeywordInput(merchant.merchantName);
    setCategoryId(null);
  };

  const handleSave = (merchant: UncategorizedMerchant) => {
    if (categoryId === null) {
      toast.error('카테고리를 선택해주세요.');
      return;
    }
    const keywords = parseKeywords(keywordInput);
    if (keywords.length === 0) {
      toast.error('키워드를 입력해주세요.');
      return;
    }
    createRule.mutate(
      { categoryId, keywords },
      {
        onSuccess: () => {
          toast.success('규칙을 저장했어요. 다음 가져오기부터 자동으로 분류돼요.');
          setExpandedKey(null);
        },
        onError: (err) => toast.error(getErrorMessage(err, '규칙 저장에 실패했습니다.')),
      },
    );
  };

  if (isLoading) {
    return <Text className="text-sm text-slate-400">불러오는 중...</Text>;
  }

  return (
    <View className="gap-3">
      <Text className="text-xs text-slate-400">
        여기서 규칙을 등록·수정·삭제해도 이미 미분류로 들어간 거래는 그대로 남아요. 다음 명세서를
        가져올 때부터 새 규칙이 적용돼요.
      </Text>

      {rules.length > 0 ? <RuleListSection rules={rules} /> : null}

      {visibleMerchants.length === 0 ? (
        <Text className="text-sm text-slate-400">미분류로 남은 가맹점이 없어요.</Text>
      ) : (
        visibleMerchants.map((merchant) => {
          const key = merchantKey(merchant);
          const expanded = expandedKey === key;
          const categoryOptions = categories.filter((category) => category.type === merchant.type && !category.isGroup);

          return (
            <View key={key} className="gap-2 rounded-xl bg-white p-4 dark:bg-slate-900">
              <Pressable className="flex-row items-center justify-between" onPress={() => handleExpand(merchant)}>
                <View className="gap-0.5">
                  <Text className="text-base font-medium text-slate-900 dark:text-white">{merchant.merchantName}</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {merchant.count}건 · {formatKrw(merchant.totalAmount)}
                  </Text>
                </View>
              </Pressable>

              {expanded ? (
                <RuleEditor
                  categoryOptions={categoryOptions}
                  categoryId={categoryId}
                  onSelectCategory={setCategoryId}
                  keywordInput={keywordInput}
                  onChangeKeywordInput={setKeywordInput}
                  onSave={() => handleSave(merchant)}
                  saving={createRule.isPending}
                />
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}
