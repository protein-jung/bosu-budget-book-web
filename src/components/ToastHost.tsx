import { useEffect, useState } from 'react';
import { Animated, Modal, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore, type ToastItem } from '@/store/toastStore';

const AUTO_DISMISS_MS = 3000;

const VARIANT_CLASSES: Record<ToastItem['variant'], string> = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-slate-800',
};

/** 앱 전역 토스트 알림.
 * - 네이티브: 열려 있는 폼 모달 위에도 보이도록 자체 Modal로 띄운다 — RN에서는 나중에 뜬
 *   Modal이 항상 먼저 뜬 Modal 위에 쌓이므로, 저장/수정/삭제 버튼을 누른 시점에 이미 열려 있는
 *   폼 모달이 있어도 토스트가 그 위에 나타난다.
 * - 웹: react-native-web의 Modal은 내부적으로 화면 전체를 덮는(pointerEvents 기본값 auto)
 *   래퍼를 하나 더 끼워 넣는데, 이건 우리가 box-none을 줘도 뚫리지 않아서 토스트가 떠 있는
 *   동안 화면의 다른 버튼을 아예 누를 수 없게 된다. 그래서 웹에서는 Modal 없이 fixed + 아주
 *   높은 zIndex로 직접 띄운다 — 실제 박스 크기가 토스트 내용만큼만 차지해서, 토스트 바깥을
 *   누르면 그대로 아래 화면 요소가 눌린다. */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();

  const banners = (
    <View pointerEvents="box-none" className="w-full max-w-[420px] gap-2 px-4">
      {toasts.map((item) => (
        <ToastBanner key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </View>
  );

  if (Platform.OS === 'web') {
    if (toasts.length === 0) return null;
    return (
      <View
        pointerEvents="box-none"
        className="items-center"
        style={{ position: 'fixed', top: insets.top + 12, left: 0, right: 0, zIndex: 9999 } as object}>
        {banners}
      </View>
    );
  }

  return (
    <Modal
      visible={toasts.length > 0}
      transparent
      animationType="none"
      onRequestClose={() => {}}
      pointerEvents="box-none">
      <View pointerEvents="box-none" className="flex-1 items-center" style={{ paddingTop: insets.top + 12 }}>
        {banners}
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
