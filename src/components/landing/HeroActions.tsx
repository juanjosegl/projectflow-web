'use client';
import { useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { useDemoLogin } from '@/hooks/useAuth';

export function HeroActions() {
  const t = useTranslations('landing');
  const user = useAuthStore((s) => s.user);
  const demo = useDemoLogin();
  // false during SSR, true after hydration: the persisted user only exists in the browser.
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  useEffect(() => {
    // Free-tier API sleeps when idle; start waking it before the visitor clicks.
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`).catch(() => {});
  }, []);

  if (mounted && user) {
    return (
      <Link href="/dashboard" className={buttonVariants({ size: 'lg', className: 'h-11 px-6' })}>
        {t('goDashboard')}
      </Link>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Button size="lg" className="h-11 px-6" onClick={() => demo.mutate()} disabled={demo.isPending}>
          {demo.isPending && <Loader2 className="animate-spin" size={16} />}
          {t('tryDemo')}
        </Button>
        <Link href="/login" className={buttonVariants({ size: 'lg', variant: 'outline', className: 'h-11 px-6' })}>
          {t('signIn')}
        </Link>
      </div>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
        {demo.isPending ? t('waking') : t('demoNote')}
      </p>
    </div>
  );
}
