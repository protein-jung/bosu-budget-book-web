import { Pressable, Text, View } from 'react-native';

import { formatAmountInput } from '@/lib/format';

import { TextField } from './TextField';

const QUICK_ADD_AMOUNT = 100000;

/** 원화 금액 입력칸. 천원 단위 콤마를 자동으로 넣어주고, 누를 때마다 10만원씩 더해주는
 * 버튼을 함께 보여준다(반복해서 누르면 계속 누적된다). */
export function AmountField({
  label,
  value,
  onChangeText,
  placeholder = '0',
  quickAdd = true,
}: {
  label: string;
  value: string;
  onChangeText: (digits: string) => void;
  placeholder?: string;
  quickAdd?: boolean;
}) {
  const handleQuickAdd = () => {
    const next = (Number(value || '0') || 0) + QUICK_ADD_AMOUNT;
    onChangeText(String(next));
  };

  return (
    <View className="gap-1.5">
      <TextField
        label={label}
        value={formatAmountInput(value)}
        onChangeText={(text) => onChangeText(text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        placeholder={placeholder}
      />
      {quickAdd ? (
        <Pressable
          onPress={handleQuickAdd}
          className="self-start rounded-full border border-dashed border-primary px-3 py-1.5 active:bg-primary-light dark:active:bg-slate-700">
          <Text className="text-xs font-medium text-primary dark:text-secondary">+10만원</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
