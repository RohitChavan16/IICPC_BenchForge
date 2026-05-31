import { LayoutDashboard, Radar, Activity, Cpu, Database, ServerCog, Bell, Sparkles, Trophy, FileText, Settings, UserCircle } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'

const links = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Submit Code', to: '/submit', icon: FileText },
  { label: 'Benchmark Sessions', to: '/benchmarks', icon: Sparkles },
  { label: 'Leaderboard', to: '/leaderboard', icon: Trophy },
  { label: 'Live Telemetry', to: '/telemetry', icon: Radar },
  { label: 'Worker Monitoring', to: '/workers', icon: Activity },
  { label: 'Infrastructure', to: '/infrastructure', icon: ServerCog },
  { label: 'Logs Explorer', to: '/logs', icon: FileText },
]

const infraLinks = [
  { label: 'Redis', to: '/infrastructure/redis', icon: Cpu },
  { label: 'PostgreSQL', to: '/infrastructure/postgres', icon: Database },
]

export function Sidebar() {
  const user = useAuthStore((state) => state.user)

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] flex-col border-r border-white/10 bg-slate-950/95 px-4 py-6 backdrop-blur-xl xl:flex">
      <div className="mb-8 flex items-center gap-3 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-violet-500/15 text-violet-300 shadow-glow">
          <Sparkles size={20} />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">IICPC BenchForge</p>
          <p className="text-lg font-semibold text-white">Command Center</p>
        </div>
      </div>

      <nav className="space-y-2">
        {links.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/10 text-white shadow-[0_20px_60px_-48px_rgba(255,255,255,0.32)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-8 rounded-[32px] border border-white/10 bg-slate-900/70 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Infrastructure</p>
        <div className="mt-4 space-y-2">
          {infraLinks.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    isActive ? 'bg-violet-500/10 text-violet-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'
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

      <div className="mt-auto rounded-[32px] border border-white/10 bg-slate-900/75 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-300">
            <UserCircle size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user?.name ?? 'Benchmark Admin'}</p>
            <p className="text-xs text-slate-500">{user?.role ?? 'Platform Operator'}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-slate-400">
          <span>Notifications</span>
          <span className="rounded-full bg-slate-900/80 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300">5</span>
        </div>
      </div>
    </aside>
  )
}
