'use client';
import { useTheme } from 'next-themes';
import { useUIStore } from '@/store/ui.store';
import { Sun, Moon, Monitor, Languages } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeLanguageToggle() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const themes = [
    { value: 'light', icon: Sun },
    { value: 'dark', icon: Moon },
    { value: 'system', icon: Monitor },
  ] as const;

  return (
    <div className="flex items-center gap-3">
      {/* Theme */}
      <div className="flex items-center gap-1 px-1">
        {themes.map(({ value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex justify-center p-1.5 rounded-md transition-colors ${
              theme === value
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title={value}
            aria-label={`${value} theme`}
            aria-pressed={theme === value}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>

      {/* Language */}
      <div className="flex items-center gap-1 px-1">
        <Languages size={13} className="text-slate-400 mr-1" />
        {(['en', 'es'] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setLocale(lang)}
            aria-pressed={locale === lang}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              locale === lang
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
