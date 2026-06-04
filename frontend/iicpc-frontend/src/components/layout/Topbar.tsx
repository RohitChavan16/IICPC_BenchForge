import { Bell, Moon, SunMedium } from 'lucide-react'
import { useThemeStore } from '@/stores/useThemeStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Link } from 'react-router-dom'

export function Topbar() {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const user = useAuthStore((state) => state.user)

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl transition-colors duration-200">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 xl:px-10">
        <div className="flex items-center gap-4">
          <div className="rounded-3xl border border-border bg-card/70 px-4 py-3 text-sm text-foreground shadow-sm">
            Platform health: <span className="font-semibold text-accent">Nominal</span>
          </div>
          <div className="hidden rounded-3xl border border-border bg-card/70 px-4 py-3 text-sm text-foreground sm:flex">
            Last sync 3s ago
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-border bg-card text-foreground transition-colors hover:bg-muted"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunMedium size={18} /> : <Moon size={18} />}
          </button>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-border bg-card text-foreground transition-colors hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          <Link
            to="/profile"
            className="inline-flex items-center gap-3 rounded-3xl border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <span className="hidden sm:inline-block">{user?.name ?? 'Operator'}</span>
            <span className="rounded-full bg-accent/15 px-2 py-1 text-xs uppercase tracking-[0.24em] text-accent">{user?.role ?? 'SRE'}</span>
          </Link>

          <button
            type="button"
            onClick={async () => {
              try {
                // Call backend logout
                const { logout } = await import('@/services/api/authService')
                await logout()
              } catch (e) {
                // Ignore failure if backend is unreachable
              }
              // Clear frontend state
              useAuthStore.getState().logout()
              window.location.href = '/login'
            }}
            className="inline-flex h-11 px-4 items-center justify-center rounded-3xl border border-border bg-card text-destructive transition-colors hover:bg-destructive/10 hover:border-destructive/30"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
