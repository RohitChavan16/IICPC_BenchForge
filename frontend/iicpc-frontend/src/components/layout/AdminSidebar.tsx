import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  Bell,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Database,
  FileCode,
  FileSearch,
  GitMerge,
  History,
  LayoutDashboard,
  LineChart,
  ListFilter,
  LogOut,
  PieChart,
  Rocket,
  Server,
  Settings,
  ShieldAlert,
  Trophy,
  User,
  Users,
  Zap,
  Moon,
  SunMedium
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUiStore } from '@/stores/useUiStore'
import { useThemeStore } from '@/stores/useThemeStore'

const adminNavSections = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Admin Dashboard', to: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    title: 'CONTEST MANAGEMENT',
    items: [
      { label: 'Teams', to: '/admin/teams', icon: Users },
      { label: 'Submissions', to: '/admin/submissions', icon: FileCode },
      { label: 'Leaderboard Mgt', to: '/admin/leaderboard', icon: Trophy },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Submission Pipeline', to: '/admin/pipeline', icon: GitMerge },
      { label: 'Queue Manager', to: '/admin/queue', icon: ListFilter },
      { label: 'Worker Pool', to: '/admin/workers', icon: Cpu },
      { label: 'Deployments', to: '/admin/deployments', icon: Rocket },
    ],
  },
  {
    title: 'INFRASTRUCTURE',
    items: [
      { label: 'System Health', to: '/admin/infrastructure', icon: Activity },
      { label: 'PostgreSQL Metrics', to: '/admin/infrastructure/postgres', icon: Database },
      { label: 'Redis Metrics', to: '/admin/infrastructure/redis', icon: Server },
      { label: 'Grafana Monitoring', to: '/admin/infrastructure/grafana', icon: BarChart3 },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { label: 'Platform Analytics', to: '/admin/analytics/platform', icon: PieChart },
      { label: 'Performance Analytics', to: '/admin/analytics/performance', icon: LineChart },
      { label: 'Correctness Analytics', to: '/admin/analytics/correctness', icon: CheckCircle2 },
    ],
  },
  {
    title: 'PLATFORM CONTROL',
    items: [
      { label: 'Scoring Engine', to: '/admin/control/scoring', icon: Calculator },
    ],
  },
  {
    title: 'MONITORING',
    items: [
      { label: 'Live Telemetry', to: '/admin/telemetry', icon: Zap },
      { label: 'Alerts', to: '/admin/monitoring/alerts', icon: Bell },
      { label: 'Events', to: '/admin/monitoring/events', icon: History },
      { label: 'Audit Logs', to: '/admin/logs', icon: FileSearch },
    ],
  },
]

export function AdminSidebar() {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  const labelVisible = isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/50 xl:hidden backdrop-blur-sm"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex min-h-screen flex-col border-r border-indigo-200/50 dark:border-indigo-900/30 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 shadow-2xl shadow-indigo-200/50 dark:shadow-indigo-950/50 transition-all duration-300 overflow-hidden ${
          isSidebarOpen ? 'w-[280px] translate-x-0' : 'w-[96px] -translate-x-full xl:translate-x-0'
        }`}
      >
        {/* Decorative operations background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-32 left-0 w-48 h-48 bg-emerald-600/10 rounded-full blur-[60px]" />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-violet-600/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e510_1px,transparent_1px),linear-gradient(to_bottom,#4f46e510_1px,transparent_1px)] bg-[size:1rem_1rem] [mask-image:linear-gradient(to_bottom,white_10%,transparent_90%)]" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-4 py-5 border-b border-indigo-200/50 dark:border-indigo-900/30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 border border-indigo-300/50 dark:border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                <ShieldAlert size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className={`overflow-hidden transition-all duration-300 ${labelVisible}`}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">BenchForge</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">Control Center</p>
              </div>
            </div>
            {isSidebarOpen && (
              <button
                onClick={toggleTheme}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-300/50 dark:border-indigo-500/30 bg-slate-100 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <SunMedium size={16} /> : <Moon size={16} />}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="absolute right-[-14px] top-6 inline-flex h-7 w-7 items-center justify-center rounded-full border border-indigo-300/50 dark:border-indigo-500/30 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all z-20 xl:hidden"
          >
            <ChevronRight size={14} className={`${isSidebarOpen ? 'rotate-180' : ''} transition-transform`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-indigo-900/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {adminNavSections.map((section) => (
            <div key={section.title} className="mb-6 space-y-1 px-3">
              <p className={`px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ${labelVisible}`}>
                {section.title}
              </p>
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/admin' || item.to === '/admin/infrastructure'}
                      className={({ isActive }) =>
                        `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 group ${
                          isActive
                            ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="admin-sidebar-active"
                              className="absolute inset-y-0 left-0 my-auto h-7 w-1.5 rounded-r bg-indigo-600 dark:bg-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.8)]"
                              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                            />
                          )}
                          <Icon size={18} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'} />
                          <span className={`whitespace-nowrap transition-opacity duration-300 ${labelVisible}`}>
                            {item.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom User Actions */}
        <div className="relative z-10 border-t border-indigo-200/50 dark:border-indigo-900/30 bg-white/80 dark:bg-slate-950/80 p-3 backdrop-blur-md space-y-1">
          <NavLink
            to="/admin/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                isActive ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`
            }
          >
            <User size={18} />
            <span className={labelVisible}>Admin Profile</span>
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                isActive ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`
            }
          >
            <Settings size={18} />
            <span className={labelVisible}>Settings</span>
          </NavLink>
          <button
            type="button"
            onClick={async () => {
              try {
                const { logout } = await import('@/services/api/authService')
                await logout()
              } catch (e) {
                // ignore
              }
              useAuthStore.getState().logout()
              window.location.href = '/login'
            }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-600 dark:text-rose-400/80 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-400 transition-all duration-200"
          >
            <LogOut size={18} />
            <span className={labelVisible}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
