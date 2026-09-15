import { Stack } from 'expo-router';

export default function PortfolioLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="change" />
      <Stack.Screen name="[type]" />
    </Stack>
  );
}
