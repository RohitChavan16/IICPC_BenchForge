import { LayoutDashboard, Radar, Activity, Cpu, Database, ServerCog, Sparkles, Trophy, FileText, UserCircle } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'

const links = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Submit Code', to: '/submit', icon: FileText, role: 'benchmark-team' },
  { label: 'Benchmark Sessions', to: '/benchmarks', icon: Sparkles },
  { label: 'Leaderboard', to: '/leaderboard', icon: Trophy },
  { label: 'Live Telemetry', to: '/telemetry', icon: Radar, role: 'admin' },
  { label: 'Worker Monitoring', to: '/workers', icon: Activity, role: 'admin' },
  { label: 'Infrastructure', to: '/infrastructure', icon: ServerCog, role: 'admin' },
  { label: 'Logs Explorer', to: '/logs', icon: FileText, role: 'admin' },
]

const infraLinks = [
  { label: 'Redis', to: '/infrastructure/redis', icon: Cpu, role: 'admin' },
  { label: 'PostgreSQL', to: '/infrastructure/postgres', icon: Database, role: 'admin' },
]

export function Sidebar() {
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'admin'


  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] flex-col border-r border-border bg-background/95 px-4 py-6 backdrop-blur-xl xl:flex transition-colors duration-200">
      <div className="mb-8 flex items-center gap-3 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-secondary/15 text-secondary shadow-sm">
          <Sparkles size={20} />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">IICPC BenchForge</p>
          <p className="text-lg font-semibold text-foreground">Command Center</p>
        </div>
      </div>

      <nav className="space-y-2">
        {links
          .filter((item) => !item.role || item.role === user?.role)
          .map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {isAdmin && (
        <div className="mt-8 rounded-[32px] border border-border bg-card/70 p-5 transition-colors duration-200">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Infrastructure</p>
          <div className="mt-4 space-y-2">
            {infraLinks
              .filter((item) => !item.role || item.role === user?.role)
              .map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors duration-200 ${
                      isActive ? 'bg-secondary/15 text-secondary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-auto space-y-4">
        <div className="rounded-[32px] border border-border bg-card/75 p-4 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-accent/15 text-accent">
              <UserCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{user?.name ?? 'Benchmark Admin'}</p>
              <p className="text-xs text-muted-foreground">{user?.role ?? 'Platform Operator'}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-muted-foreground">
            <span>Notifications</span>
            <span className="rounded-full bg-muted px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-foreground">5</span>
          </div>
        </div>

        <button
          onClick={async () => {
            try {
              const { logout } = await import('@/services/api/authService')
              await logout()
            } catch (e) {}
            useAuthStore.getState().logout()
            window.location.href = '/login'
          }}
          className="flex w-full items-center justify-center gap-2 rounded-3xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 hover:text-destructive"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
