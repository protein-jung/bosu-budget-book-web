import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, secureTextEntry, ...inputProps }: TextFieldProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</Text>
      <View className="justify-center">
        <TextInput
          placeholderTextColor="#94a3b8"
          secureTextEntry={isPassword && !visible}
          className={`rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white ${isPassword ? 'pr-11' : ''}`}
          {...inputProps}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            className="absolute right-3 top-3.5">
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text> : null}
    </View>
  );
}
