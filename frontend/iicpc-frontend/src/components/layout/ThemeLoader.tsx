import { useEffect } from 'react'
import { useThemeStore } from '@/stores/useThemeStore'

export function ThemeLoader({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light')
    document.documentElement.classList.toggle('theme-dark', theme === 'dark')
  }, [theme])

  return <>{children}</>
}
