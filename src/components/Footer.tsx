import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export function Footer() {
  return (
    <View className="mt-6 items-center gap-2 border-t border-slate-100 pt-6">
      <View className="flex-row items-baseline gap-1">
        <Text className="text-xs text-slate-400">© 2026</Text>
        <Text className="font-brand text-xs text-slate-400">BOSU</Text>
        <Text className="text-xs font-light text-slate-400">Ledger</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Link href="/blog" className="text-xs text-slate-500">
          블로그
        </Link>
        <View className="h-3 w-px bg-slate-200" />
        <Link href="/terms" className="text-xs text-slate-500">
          이용약관
        </Link>
        <View className="h-3 w-px bg-slate-200" />
        <Link href="/privacy" className="text-xs text-slate-500">
          개인정보처리방침
        </Link>
      </View>
    </View>
  );
}
