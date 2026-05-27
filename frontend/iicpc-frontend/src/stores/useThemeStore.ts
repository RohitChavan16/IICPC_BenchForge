import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark'

interface ThemeState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const defaultTheme = (typeof window !== 'undefined' && window.localStorage.getItem('benchforge_theme')) as ThemeMode | null || import.meta.env.VITE_DEFAULT_THEME === 'light' ? 'light' : 'dark'

export const useThemeStore = create<ThemeState>((set) => ({
  theme: defaultTheme,
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('benchforge_theme', theme)
    }
    set({ theme })
  },
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('benchforge_theme', next)
    }
    return { theme: next }
  }),
}))
