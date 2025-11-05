import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  customPrimary: string | null;
  customAccent: string | null;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCustomColors: (primary: string, accent: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      customPrimary: null,
      customAccent: null,
      setTheme: (theme) => set({ theme }),
      setCustomColors: (primary, accent) => set({ customPrimary: primary, customAccent: accent }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
