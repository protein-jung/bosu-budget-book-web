import { create } from 'zustand';

import { storage } from '@/lib/storage';

type AdminAuthState = {
  accessToken: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setToken: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

const TOKEN_KEY = 'housebook_admin_token';

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  accessToken: null,
  hydrated: false,
  hydrate: async () => {
    const token = await storage.getItem(TOKEN_KEY);
    set({ accessToken: token, hydrated: true });
  },
  setToken: async (accessToken) => {
    await storage.setItem(TOKEN_KEY, accessToken);
    set({ accessToken });
  },
  logout: async () => {
    await storage.removeItem(TOKEN_KEY);
    set({ accessToken: null });
  },
}));
