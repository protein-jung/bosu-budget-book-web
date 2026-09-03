import { create } from 'zustand';

import { storage } from '@/lib/storage';

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  birthDate: string | null;
  isAdmin: boolean;
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (accessToken: string, user: AuthUser) => Promise<void>;
  updateUser: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
};

const TOKEN_KEY = 'housebook_token';
const USER_KEY = 'housebook_user';

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  hydrate: async () => {
    const [token, userRaw] = await Promise.all([storage.getItem(TOKEN_KEY), storage.getItem(USER_KEY)]);
    set({
      accessToken: token,
      user: userRaw ? (JSON.parse(userRaw) as AuthUser) : null,
      hydrated: true,
    });
  },
  setSession: async (accessToken, user) => {
    await Promise.all([storage.setItem(TOKEN_KEY, accessToken), storage.setItem(USER_KEY, JSON.stringify(user))]);
    set({ accessToken, user });
  },
  updateUser: async (user) => {
    await storage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },
  logout: async () => {
    await Promise.all([storage.removeItem(TOKEN_KEY), storage.removeItem(USER_KEY)]);
    set({ accessToken: null, user: null });
  },
}));
