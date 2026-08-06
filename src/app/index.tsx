import { Redirect } from 'expo-router';

import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return <Redirect href={accessToken ? '/calendar' : '/login'} />;
}
