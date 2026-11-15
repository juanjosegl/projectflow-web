'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/lib/services/auth.service';
import { clearQueryCache } from '@/lib/providers';

// Public demo account created by the API seed (prisma/seed.ts); safe to ship in the client.
const DEMO = { email: 'alice@projectflow.dev', password: 'Password123!' };

export function useDemoLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: () => authService.login(DEMO),
    onSuccess: ({ user, accessToken }) => {
      clearQueryCache();
      setAuth(user, accessToken);
      router.push('/dashboard');
    },
    onError: () => toast.error('The demo account is not available right now. Try again in a minute.'),
  });
}

// During SSR and the hydration render zustand reports its initial state (user = null),
// so redirecting before the persisted user is read would bounce every page refresh to /login.
function useHydrated() {
  return useSyncExternalStore(
    (cb) => useAuthStore.persist.onFinishHydration(cb),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
}

export function useRequireAuth() {
  const { user } = useAuthStore();
  const hydrated = useHydrated();
  const router = useRouter();
  useEffect(() => {
    if (hydrated && !user) router.replace('/login');
  }, [hydrated, user, router]);
  return { user: hydrated ? user : null };
}

export function useRedirectIfAuth() {
  const { user } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);
}
