import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { TextField } from '@/components/TextField';
import type { AddressCandidate } from '@/lib/types';

import { useSearchAddresses } from './api';

export function AddressAutocomplete({
  value,
  onChangeText,
  onSelect,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (candidate: AddressCandidate) => void;
}) {
  const searchAddresses = useSearchAddresses();
  const [candidates, setCandidates] = useState<AddressCandidate[]>([]);
  const [dirty, setDirty] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dirty) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setCandidates([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      searchAddresses.mutate(value.trim(), {
        onSuccess: setCandidates,
        onError: () => setCandidates([]),
      });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, dirty]);

  const handleSelect = (candidate: AddressCandidate) => {
    onChangeText(candidate.roadAddress ?? candidate.jibunAddress ?? '');
    onSelect(candidate);
    setCandidates([]);
    setDirty(false);
  };

  return (
    <View className="gap-1.5">
      <TextField
        label="주소"
        value={value}
        onChangeText={(text) => {
          setDirty(true);
          onChangeText(text);
        }}
        placeholder="도로명 또는 지번 주소를 입력하세요"
      />
      {searchAddresses.isPending ? (
        <View className="items-center py-2">
          <ActivityIndicator size="small" />
        </View>
      ) : null}
      {candidates.length > 0 ? (
        <View className="gap-1 rounded-xl bg-cream p-2 dark:bg-slate-800">
          {candidates.map((candidate, index) => (
            <Pressable
              key={index}
              onPress={() => handleSelect(candidate)}
              className="rounded-lg bg-white p-2.5 dark:bg-slate-900">
              <Text className="text-sm font-medium text-slate-900 dark:text-white">
                {candidate.roadAddress ?? candidate.jibunAddress}
              </Text>
              {candidate.roadAddress && candidate.jibunAddress ? (
                <Text className="text-xs text-slate-400">{candidate.jibunAddress}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
