import { Pressable, Text } from 'react-native';

export function Chip({
  label,
  selected,
  onPress,
  color,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string | null;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 ${
        selected
          ? 'border-blue-600 bg-blue-600'
          : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
      }`}>
      {color ? <Text style={{ color }}>●</Text> : null}
      <Text className={selected ? 'font-medium text-white' : 'text-slate-700 dark:text-slate-200'}>{label}</Text>
    </Pressable>
  );
}
