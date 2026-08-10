import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { TextField } from '@/components/TextField';
import type { StockSymbolCandidate } from '@/lib/types';

import { useSearchStockSymbols } from './api';

export function StockSymbolAutocomplete({
  value,
  onChangeText,
  onSelect,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (candidate: StockSymbolCandidate) => void;
}) {
  const searchSymbols = useSearchStockSymbols();
  const [candidates, setCandidates] = useState<StockSymbolCandidate[]>([]);
  const [dirty, setDirty] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dirty) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 1) {
      setCandidates([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      searchSymbols.mutate(value.trim(), {
        onSuccess: setCandidates,
        onError: () => setCandidates([]),
      });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, dirty]);

  const handleSelect = (candidate: StockSymbolCandidate) => {
    onChangeText(candidate.symbol);
    onSelect(candidate);
    setCandidates([]);
    setDirty(false);
  };

  return (
    <View className="gap-1.5">
      <TextField
        label="심볼(티커)"
        value={value}
        onChangeText={(text) => {
          setDirty(true);
          onChangeText(text);
        }}
        autoCapitalize="characters"
        placeholder="종목명 또는 티커 (예: 삼성전자, AAPL)"
      />
      {searchSymbols.isPending ? (
        <View className="items-center py-2">
          <ActivityIndicator size="small" />
        </View>
      ) : null}
      {candidates.length > 0 ? (
        <View className="gap-1 rounded-xl bg-cream p-2 dark:bg-slate-800">
          {candidates.map((candidate) => (
            <Pressable
              key={candidate.symbol}
              onPress={() => handleSelect(candidate)}
              className="flex-row items-center justify-between rounded-lg bg-white p-2.5 dark:bg-slate-900">
              <View>
                <Text className="text-sm font-medium text-slate-900 dark:text-white">{candidate.name}</Text>
                <Text className="text-xs text-slate-400">{candidate.exchange}</Text>
              </View>
              <Text className="text-xs font-semibold text-primary">{candidate.symbol}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
