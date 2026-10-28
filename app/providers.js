'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const THEMES = {
  blue: { label: 'Ocean Blue', color: '#2563eb' },
  violet: { label: 'Violet', color: '#7c3aed' },
  emerald: { label: 'Emerald', color: '#059669' },
  rose: { label: 'Rose', color: '#e11d48' },
};

export function useSiteTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useSiteTheme must be used inside SiteProviders');
  return value;
}

export default function SiteProviders({ children }) {
  const [mode, setMode] = useState('light');
  const [accent, setAccent] = useState('blue');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('qt-theme-mode');
      const savedAccent = localStorage.getItem('qt-theme-accent');
      if (savedMode === 'dark' || savedMode === 'light') setMode(savedMode);
      if (savedAccent && Object.hasOwn(THEMES, savedAccent)) setAccent(savedAccent);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.dataset.accent = accent;
    document.documentElement.style.colorScheme = mode;
    try {
      localStorage.setItem('qt-theme-mode', mode);
      localStorage.setItem('qt-theme-accent', accent);
    } catch {}
  }, [mode, accent]);

  const toggleMode = useCallback(() => setMode(current => current === 'dark' ? 'light' : 'dark'), []);
  const value = useMemo(() => ({ mode, accent, themes: THEMES, setMode, setAccent, toggleMode, ready }), [mode, accent, toggleMode, ready]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
