import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

const YEARS_PER_PAGE = 12;

/** 연도를 누르면 뜨는 팝업. 12년 단위로 페이지를 넘기며(«/») 원하는 연도로 바로 이동할 수 있다 —
 * 월 이동 버튼을 수십 번 누르지 않고도 몇 년 전/후로 한 번에 건너뛸 때 쓴다. */
export function YearPickerModal({
  visible,
  onClose,
  year,
  onSelectYear,
}: {
  visible: boolean;
  onClose: () => void;
  year: number;
  onSelectYear: (year: number) => void;
}) {
  const [pageStart, setPageStart] = useState(year - Math.floor(YEARS_PER_PAGE / 2));

  useEffect(() => {
    if (!visible) return;
    setPageStart(year - Math.floor(YEARS_PER_PAGE / 2));
  }, [visible, year]);

  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageStart + i);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/40 p-6" onPress={onClose}>
        <Pressable
          className="w-[300px] gap-3 rounded-2xl bg-white p-4 dark:bg-slate-900"
          onPress={(e) => e.stopPropagation()}>
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => setPageStart((p) => p - YEARS_PER_PAGE)} className="px-3 py-1">
              <Text className="text-lg text-slate-600 dark:text-slate-300">«</Text>
            </Pressable>
            <Text className="font-semibold text-slate-900 dark:text-white">
              {years[0]} - {years[years.length - 1]}
            </Text>
            <Pressable onPress={() => setPageStart((p) => p + YEARS_PER_PAGE)} className="px-3 py-1">
              <Text className="text-lg text-slate-600 dark:text-slate-300">»</Text>
            </Pressable>
          </View>

          <View className="flex-row flex-wrap gap-1.5">
            {years.map((y) => (
              <Pressable
                key={y}
                onPress={() => {
                  onSelectYear(y);
                  onClose();
                }}
                className={`rounded-lg px-3 py-2 ${y === year ? 'bg-primary-light dark:bg-primary-dark' : ''}`}
                style={{ width: '31%' }}>
                <Text
                  className={`text-center text-sm ${
                    y === year ? 'font-bold text-primary dark:text-secondary' : 'text-slate-700 dark:text-slate-200'
                  }`}>
                  {y}년
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => {
              onSelectYear(new Date().getFullYear());
              onClose();
            }}
            className="items-center py-2">
            <Text className="text-sm font-semibold text-primary">올해</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
