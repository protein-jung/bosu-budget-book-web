import { ActivityIndicator, Pressable, Text } from 'react-native';

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-blue-600 active:bg-blue-700',
  secondary: 'bg-slate-200 active:bg-slate-300 dark:bg-slate-700 dark:active:bg-slate-600',
  danger: 'bg-red-600 active:bg-red-700',
};

const VARIANT_TEXT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'text-white',
  secondary: 'text-slate-900 dark:text-white',
  danger: 'text-white',
};

export function Button({ title, onPress, loading, disabled, variant = 'primary' }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`items-center justify-center rounded-xl px-4 py-3 ${VARIANT_CLASSES[variant]} ${
        isDisabled ? 'opacity-50' : ''
      }`}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#0f172a' : '#ffffff'} />
      ) : (
        <Text className={`text-base font-semibold ${VARIANT_TEXT_CLASSES[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
}
