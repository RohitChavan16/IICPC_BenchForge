import { useEffect } from 'react'
import { useThemeStore } from '@/stores/useThemeStore'

export function ThemeLoader({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'light', 'dark')
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.add('light')
    }
  }, [theme])

  return <>{children}</>
}
