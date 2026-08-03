import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '@/src/utils/storage';
import { darkColors, lightColors, ThemeColors, ThemeMode } from './colors';

type ThemePref = 'dark' | 'light' | 'auto';

interface ThemeCtx {
  mode: ThemeMode;
  pref: ThemePref;
  colors: ThemeColors;
  setPref: (p: ThemePref) => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

const PREF_KEY = 'theme_pref_v1';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const v = await storage.getItem(PREF_KEY, 'dark');
      if (v === 'dark' || v === 'light' || v === 'auto') setPrefState(v);
      setLoaded(true);
    })();
  }, []);

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    storage.setItem(PREF_KEY, p);
  }, []);

  const mode: ThemeMode =
    pref === 'auto' ? (system === 'light' ? 'light' : 'dark') : pref;
  const colors = mode === 'dark' ? darkColors : lightColors;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ mode, pref, colors, setPref }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
