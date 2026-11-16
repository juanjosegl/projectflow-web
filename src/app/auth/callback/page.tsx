'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { accessToken, useAuthStore } from '@/store/auth.store';
import { authService } from '@/lib/services/auth.service';
import { clearQueryCache } from '@/lib/providers';

// Landing page of the Google sign-in. The API puts the access token in the URL fragment
// (#token=...), which is never sent to any server; it is read once and removed from history.
export default function AuthCallbackPage() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('token');
    window.history.replaceState(null, '', window.location.pathname);
    if (!token) {
      router.replace('/login');
      return;
    }

    accessToken.set(token);
    clearQueryCache();
    authService
      .me()
      .then((user) => {
        signIn(user, token);
        router.replace(params.get('new') === 'true' ? '/complete-profile' : '/dashboard');
      })
      .catch(() => router.replace('/login'));
  }, [router, signIn]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <Loader2 className="animate-spin text-slate-400 mx-auto mb-3" size={32} />
        <p className="text-sm text-slate-500 dark:text-slate-400">Signing you in...</p>
      </div>
    </div>
  );
}
