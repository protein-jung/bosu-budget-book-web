import { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore, type ToastItem } from '@/store/toastStore';

const AUTO_DISMISS_MS = 3000;

const VARIANT_CLASSES: Record<ToastItem['variant'], string> = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-slate-800',
};

/** 앱 전역 토스트 알림. 열려 있는 폼 모달 위에도 보이도록 자체 Modal로 띄운다 — RN에서는 나중에
 * 뜬 Modal이 항상 먼저 뜬 Modal 위에 쌓이므로, 저장/수정/삭제 버튼을 누른 시점에 이미 열려 있는
 * 폼 모달이 있어도 토스트가 그 위에 나타난다. */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={toasts.length > 0}
      transparent
      animationType="none"
      onRequestClose={() => {}}
      pointerEvents="box-none">
      <View pointerEvents="box-none" className="flex-1 items-center" style={{ paddingTop: insets.top + 12 }}>
        <View pointerEvents="box-none" className="w-full max-w-[420px] gap-2 px-4">
          {toasts.map((item) => (
            <ToastBanner key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
          ))}
        </View>
      </View>
    </Modal>
  );
}

function ToastBanner({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-12));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(onDismiss);
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        onPress={onDismiss}
        className={`rounded-xl px-4 py-3 shadow-lg ${VARIANT_CLASSES[item.variant]}`}>
        <Text className="text-sm font-semibold text-white">{item.message}</Text>
      </Pressable>
    </Animated.View>
  );
}
