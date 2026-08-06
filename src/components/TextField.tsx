import { Text, TextInput, View, type TextInputProps } from 'react-native';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, ...inputProps }: TextFieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</Text>
      <TextInput
        placeholderTextColor="#94a3b8"
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        {...inputProps}
      />
      {error ? <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text> : null}
    </View>
  );
}
