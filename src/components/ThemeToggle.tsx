'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('anime-vault-theme') as Theme | null;
    return stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('anime-vault-theme', next);
    document.documentElement.dataset.theme = next;
  };

  return (
    <button type="button" onClick={toggle} className="theme-toggle" aria-label={`${theme === 'light' ? 'Dark' : 'Light'} themeへ切り替え`}>
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
      <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
    </button>
  );
}