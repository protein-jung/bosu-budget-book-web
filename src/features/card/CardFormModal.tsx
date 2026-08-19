import { useEffect, useState } from 'react';
import { Modal, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { useMyHousehold } from '@/features/household/api';
import { getErrorMessage } from '@/lib/apiClient';
import { useIsDesktop } from '@/lib/responsive';
import type { CardAccount, CardType } from '@/lib/types';
import { toast } from '@/store/toastStore';

import { useCreateCard, useDeleteCard, useUpdateCard } from './api';

const CARD_TYPES: { value: CardType; label: string }[] = [
  { value: 'CREDIT', label: '신용카드' },
  { value: 'DEBIT', label: '체크카드' },
  { value: 'CASH', label: '현금' },
];

export function CardFormModal({
  visible,
  onClose,
  card,
}: {
  visible: boolean;
  onClose: () => void;
  card?: CardAccount | null;
}) {
  const isEdit = !!card;
  const isDesktop = useIsDesktop();
  const { data: household } = useMyHousehold();
  const [name, setName] = useState('');
  const [type, setType] = useState<CardType>('CREDIT');
  const [ownerUserId, setOwnerUserId] = useState<number | null>(null);

  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();
  const isPending = createCard.isPending || updateCard.isPending || deleteCard.isPending;

  useEffect(() => {
    if (!visible) return;
    if (card) {
      setName(card.name);
      setType(card.type);
      setOwnerUserId(card.ownerUserId);
    } else {
      setName('');
      setType('CREDIT');
      setOwnerUserId(null);
    }
  }, [visible, card]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('카드 이름을 입력해주세요.');
      return;
    }
    const payload = { name: name.trim(), type, ownerUserId };
    if (isEdit && card) {
      updateCard.mutate(
        { id: card.id, data: payload },
        {
          onSuccess: () => {
            toast.success('카드를 수정했어요.');
            onClose();
          },
          onError: (err) => toast.error(getErrorMessage(err, '수정에 실패했습니다.')),
        },
      );
    } else {
      createCard.mutate(payload, {
        onSuccess: () => {
          toast.success('카드를 추가했어요.');
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err, '추가에 실패했습니다.')),
      });
    }
  };

  const handleDelete = () => {
    if (!card) return;
    deleteCard.mutate(card.id, {
      onSuccess: () => {
        toast.success('카드를 삭제했어요.');
        onClose();
      },
      onError: (err) => toast.error(getErrorMessage(err, '삭제에 실패했습니다.')),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className={`flex-1 bg-black/40 ${isDesktop ? 'items-center justify-center' : 'justify-end'}`}>
        <View
          className={`gap-4 bg-white p-5 dark:bg-slate-900 ${
            isDesktop ? 'w-full max-w-[560px] rounded-3xl' : 'rounded-t-3xl'
          }`}>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            {isEdit ? '카드 수정' : '카드 추가'}
          </Text>

          <TextField label="이름" value={name} onChangeText={setName} placeholder="예) 삼성카드" />

          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">종류</Text>
            <View className="flex-row flex-wrap gap-2">
              {CARD_TYPES.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={type === option.value}
                  onPress={() => setType(option.value)}
                />
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">사용자 (선택)</Text>
            <View className="flex-row flex-wrap gap-2">
              <Chip label="공용" selected={ownerUserId === null} onPress={() => setOwnerUserId(null)} />
              {household?.members.map((member) => (
                <Chip
                  key={member.userId}
                  label={member.name}
                  selected={ownerUserId === member.userId}
                  onPress={() => setOwnerUserId(member.userId)}
                />
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Button title={isEdit ? '수정하기' : '추가하기'} onPress={handleSubmit} loading={isPending} />
            {isEdit ? <Button title="삭제하기" variant="danger" onPress={handleDelete} loading={isPending} /> : null}
            <Button title="취소" variant="secondary" onPress={onClose} disabled={isPending} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
