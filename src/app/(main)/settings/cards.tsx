import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useCards } from '@/features/card/api';
import { CardFormModal } from '@/features/card/CardFormModal';
import { useIsDesktop } from '@/lib/responsive';
import type { CardAccount } from '@/lib/types';

const CARD_TYPE_LABEL: Record<CardAccount['type'], string> = {
  CREDIT: '신용카드',
  DEBIT: '체크카드',
  CASH: '현금',
};

export default function CardsScreen() {
  const { data: cards = [] } = useCards();
  const [editing, setEditing] = useState<CardAccount | null | undefined>(undefined);
  const isDesktop = useIsDesktop();

  return (
    <Screen maxWidthClassName={isDesktop ? 'max-w-[680px]' : 'max-w-[480px]'}>
      <View className={isDesktop ? 'flex-row flex-wrap gap-3' : 'gap-2'}>
        {cards.length === 0 ? (
          <Text className="text-sm text-slate-400">아직 등록된 카드가 없어요.</Text>
        ) : (
          cards.map((card) => (
            <Pressable
              key={card.id}
              onPress={() => setEditing(card)}
              className={`gap-1 rounded-xl bg-white p-4 dark:bg-slate-900 ${isDesktop ? 'w-[48%] p-5' : ''}`}>
              <Text className="text-base font-semibold text-slate-900 dark:text-white">{card.name}</Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                {CARD_TYPE_LABEL[card.type]}
                {card.ownerName ? ` · ${card.ownerName}` : ' · 공용'}
              </Text>
            </Pressable>
          ))
        )}
      </View>

      <Pressable
        onPress={() => setEditing(null)}
        className={`items-center rounded-xl bg-primary p-4 ${isDesktop ? 'self-start px-8' : ''}`}>
        <Text className="font-semibold text-white">+ 카드 추가</Text>
      </Pressable>

      <CardFormModal visible={editing !== undefined} onClose={() => setEditing(undefined)} card={editing} />
    </Screen>
  );
}
