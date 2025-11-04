import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'dark' | 'light';
  customPrimary: string;
  customAccent: string;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setCustomColors: (primary: string, accent: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      customPrimary: '#000000',
      customAccent: '#ffffff',
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
          return { theme: newTheme };
        }),
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },
      setCustomColors: (primary, accent) => {
        // Apply custom colors to CSS variables
        document.documentElement.style.setProperty('--custom-primary', primary);
        document.documentElement.style.setProperty('--custom-accent', accent);
        set({ customPrimary: primary, customAccent: accent });
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
