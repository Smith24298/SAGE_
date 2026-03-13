'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'coral' | 'deep';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeColors: Record<Theme, { bg: string; fg: string; primary: string }> = {
  light: {
    bg: '#f5f5f5',
    fg: '#414240',
    primary: '#e1634a',
  },
  dark: {
    bg: '#0f0f0f',
    fg: '#f5f5f5',
    primary: '#e1634a',
  },
  coral: {
    bg: '#1a1a1a',
    fg: '#f5f5f5',
    primary: '#e1634a',
  },
  deep: {
    bg: '#0f0f0f',
    fg: '#e1634a',
    primary: '#f5f5f5',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Try to get theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && Object.keys(themeColors).includes(savedTheme)) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      applyTheme(initialTheme);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const colors = themeColors[newTheme];
    const root = document.documentElement;

    // Apply CSS variables with transition
    root.style.transition = 'background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), color 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

    // Set CSS custom properties
    root.style.setProperty('--background', colors.bg);
    root.style.setProperty('--foreground', colors.fg);
    root.style.setProperty('--primary', colors.primary);

    // Also update via inline style on body
    document.body.style.backgroundColor = colors.bg;
    document.body.style.color = colors.fg;

    localStorage.setItem('theme', newTheme);
  };

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
