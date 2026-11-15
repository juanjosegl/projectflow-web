import { Bricolage_Grotesque } from 'next/font/google';
import { getTranslations } from 'next-intl/server';
import { KanbanSquare, ShieldCheck, MailPlus, MessageSquare, LayoutDashboard, Languages } from 'lucide-react';
import { HeroActions } from '@/components/landing/HeroActions';
import { ThemeLanguageToggle } from '@/components/layout/ThemeLanguageToggle';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['600', '700'] });

const GITHUB = 'https://github.com/juanjosegl';

// Static preview of the real board; one card animates once (see globals.css .demo-card-move).
const COLUMNS = [
  { name: 'To do', tint: 'bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/60', cards: [['Write API documentation', 'Medium'], ['Mobile responsive fixes', 'Medium']] },
  { name: 'In progress', tint: 'bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/60', cards: [['Implement authentication flow', 'Urgent']] },
  { name: 'In review', tint: 'bg-purple-50 border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/60', cards: [['Setup CI/CD pipeline', 'High']] },
] as const;

const STACK = {
  api: ['NestJS 11', 'Prisma 6 + PostgreSQL', 'JWT access + rotating refresh cookie', 'Google OAuth 2.0', 'Swagger / OpenAPI', 'Resend for email'],
  web: ['Next.js 16 (App Router)', 'React 19 + TypeScript', 'TanStack Query', 'Zustand', 'Tailwind CSS 4 + shadcn/ui', 'next-intl (EN / ES)'],
};

export default async function LandingPage() {
  const t = await getTranslations('landing');
  const features = [
    { icon: KanbanSquare, title: t('f1t'), desc: t('f1d') },
    { icon: ShieldCheck, title: t('f2t'), desc: t('f2d') },
    { icon: MailPlus, title: t('f3t'), desc: t('f3d') },
    { icon: MessageSquare, title: t('f4t'), desc: t('f4d') },
    { icon: LayoutDashboard, title: t('f5t'), desc: t('f5d') },
    { icon: Languages, title: t('f6t'), desc: t('f6d') },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-5">
        <span className={`${display.className} text-lg font-bold tracking-tight text-slate-900 dark:text-white`}>
          ProjectFlow
        </span>
        <ThemeLanguageToggle />
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 pt-10 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
          <div className="max-w-xl">
            <h1 className={`${display.className} text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.5rem]`}>
              {t('title')}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">{t('subtitle')}</p>
            <div className="mt-8">
              <HeroActions />
            </div>
          </div>

          <div aria-hidden className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Website Redesign</span>
              <span className="text-xs text-slate-400">Engineering Team</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {COLUMNS.map((col, ci) => (
                <div key={col.name} className={`min-h-56 rounded-lg border p-2 ${col.tint}`}>
                  <p className="mb-2 px-1 text-xs font-medium text-slate-600 dark:text-slate-300">{col.name}</p>
                  <div className="space-y-2">
                    {col.cards.map(([title, prio]) => (
                      <div
                        key={title}
                        className={`min-h-[4.75rem] rounded-md border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-950 ${ci === 1 ? 'demo-card-move' : ''}`}
                      >
                        <p className="text-xs font-medium leading-snug text-slate-800 dark:text-slate-200">{title}</p>
                        <p className="mt-2 text-[11px] text-slate-400">{prio}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-100 dark:border-slate-900">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
            <h2 className={`${display.className} text-2xl font-bold tracking-tight text-slate-900 dark:text-white`}>
              {t('featuresTitle')}
            </h2>
            <ul className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex gap-3">
                  <Icon className="mt-0.5 shrink-0 text-slate-400" size={20} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-slate-100 dark:border-slate-900">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
            <h2 className={`${display.className} text-2xl font-bold tracking-tight text-slate-900 dark:text-white`}>
              {t('stackTitle')}
            </h2>
            <div className="mt-8 grid gap-10 sm:grid-cols-2">
              {([['stackApi', STACK.api, 'projectflow-api'], ['stackWeb', STACK.web, 'projectflow-web']] as const).map(([label, items, repo]) => (
                <div key={label}>
                  <div className="flex items-baseline justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                    <p className="font-semibold text-slate-900 dark:text-white">{t(label)}</p>
                    <a href={`${GITHUB}/${repo}`} target="_blank" rel="noreferrer" className="text-sm text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline dark:hover:text-white">
                      {t('source')}
                    </a>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {items.map((i) => <li key={i}>{i}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 dark:border-slate-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-sm text-slate-500">{t('builtBy')}</div>
      </footer>
    </div>
  );
}
