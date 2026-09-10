import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('nova-theme') as Theme) || 'dark';
  });
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
    const stored = (localStorage.getItem('nova-theme') as Theme) || 'dark';
    return stored === 'system' ? getSystemTheme() : stored;
  });

  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(resolved);

    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(resolved);

    if (resolved === 'dark') {
      root.style.colorScheme = 'dark';
    } else {
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const resolved = getSystemTheme();
      setResolvedTheme(resolved);
      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(resolved);
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('nova-theme', newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
