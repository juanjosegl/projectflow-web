import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

const TOKEN_KEY = 'access_token';

/**
 * The short-lived (15 min) access token. The long-lived refresh token never touches
 * JavaScript: it lives in an httpOnly cookie set by the API.
 */
export const accessToken = {
  get: () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

interface AuthState {
  user: User | null;
  signIn: (user: User, token: string) => void;
  updateUser: (changes: Partial<User>) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      signIn: (user, token) => {
        accessToken.set(token);
        set({ user });
      },
      updateUser: (changes) => set((s) => ({ user: s.user && { ...s.user, ...changes } })),
      signOut: () => {
        accessToken.clear();
        set({ user: null });
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user }) },
  ),
);
