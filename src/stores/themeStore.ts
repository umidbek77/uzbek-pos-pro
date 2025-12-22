import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      toggleTheme: () => set({ mode: get().mode === 'light' ? 'dark' : 'light' }),
      setTheme: (mode) => set({ mode }),
    }),
    {
      name: 'theme-store',
    }
  )
);
