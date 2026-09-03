import { Pressable, Text } from 'react-native';

export function Chip({
  label,
  selected,
  onPress,
  color,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string | null;
  icon?: string | null;
}) {
  // 카테고리처럼 고유 색이 있는 칩은 선택 전에도 그 색을 옅게 배경/테두리에 써서, 아이콘이 같이
  // 있어도(이모지가 있으면 색 점만으로는 구분이 안 됨) 여러 개를 늘어놨을 때 색으로 바로 구분되게 한다.
  const tinted = !selected && !!color;
  return (
    <Pressable
      onPress={onPress}
      style={tinted ? { backgroundColor: `${color}1a`, borderColor: `${color}66` } : undefined}
      className={`flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 ${
        selected ? 'border-primary bg-primary' : tinted ? '' : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
      }`}>
      {icon ? <Text>{icon}</Text> : null}
      <Text className={selected ? 'font-medium text-white' : 'text-slate-700 dark:text-slate-200'}>{label}</Text>
    </Pressable>
  );
}
