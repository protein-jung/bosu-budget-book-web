import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TextField } from '@/components/TextField';

import { useAssets } from './api';

export function CustodianField({ value, onChangeText }: { value: string; onChangeText: (text: string) => void }) {
  const { data: assets = [] } = useAssets();
  const [focused, setFocused] = useState(false);

  const knownCustodians = useMemo(() => {
    const set = new Set<string>();
    for (const asset of assets) {
      if (asset.custodian) set.add(asset.custodian);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [assets]);

  const suggestions = useMemo(() => {
    const needle = value.trim();
    const pool = needle ? knownCustodians.filter((c) => c !== needle && c.includes(needle)) : knownCustodians;
    return pool.slice(0, 6);
  }, [knownCustodians, value]);

  return (
    <View className="gap-1.5">
      <TextField
        label="보관처 (선택)"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="예) 미래에셋증권, 업비트, ○○은행"
      />
      {focused && suggestions.length > 0 ? (
        <View className="gap-1 rounded-xl bg-cream p-2 dark:bg-slate-800">
          {suggestions.map((custodian) => (
            <Pressable
              key={custodian}
              onPress={() => {
                onChangeText(custodian);
                setFocused(false);
              }}
              className="rounded-lg bg-white p-2.5 dark:bg-slate-900">
              <Text className="text-sm font-medium text-slate-900 dark:text-white">{custodian}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
