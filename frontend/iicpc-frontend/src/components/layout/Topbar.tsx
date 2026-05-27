import { Bell, Moon, SunMedium } from 'lucide-react'
import { useThemeStore } from '@/stores/useThemeStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Link } from 'react-router-dom'

export function Topbar() {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const user = useAuthStore((state) => state.user)

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 xl:px-10">
        <div className="flex items-center gap-4">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-300 shadow-glow">
            Platform health: <span className="font-semibold text-cyan-300">Nominal</span>
          </div>
          <div className="hidden rounded-3xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-300 sm:flex">
            Last sync 3s ago
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-white/10 bg-slate-900/80 text-slate-300 transition hover:bg-slate-900"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunMedium size={18} /> : <Moon size={18} />}
          </button>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-white/10 bg-slate-900/80 text-slate-300 transition hover:bg-slate-900"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          <Link
            to="/profile"
            className="inline-flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-900"
          >
            <span className="hidden sm:inline-block">{user?.name ?? 'Operator'}</span>
            <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-xs uppercase tracking-[0.24em] text-cyan-300">{user?.role ?? 'SRE'}</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
