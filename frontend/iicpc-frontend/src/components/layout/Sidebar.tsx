import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  ChevronRight,
  Clock3,
  FileInput,
  Home,
  LogOut,
  Flame,
  Settings2,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUiStore } from '@/stores/useUiStore'

const navSections = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: Home },
      { label: 'Submit Code', to: '/submit', icon: FileInput },
      { label: 'Submission History', to: '/submissions', icon: Clock3 },
    ],
  },
  {
    title: 'PERFORMANCE',
    items: [
      { label: 'Benchmark Sessions', to: '/benchmarks', icon: Sparkles },
      { label: 'Analytics', to: '/benchmarks/analytics', icon: BarChart3 },
      { label: 'Leaderboard', to: '/leaderboard', icon: Trophy },
    ],
  },
]

export function Sidebar() {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)

  const labelVisible = isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/35 xl:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex min-h-screen flex-col border-r-2 bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950 px-3 py-5 shadow-2xl shadow-slate-950/10 backdrop-blur-xl transition-all duration-300 overflow-hidden ${
          isSidebarOpen ? 'w-[280px] translate-x-0' : 'w-[96px] -translate-x-full xl:translate-x-0'
        }`}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Vertical lines */}
          <div className="absolute top-0 left-8 w-0.5 h-32 bg-gradient-to-b from-cyan-400/20 to-transparent dark:from-cyan-400/10" />
          <div className="absolute top-40 right-12 w-0.5 h-40 bg-gradient-to-b from-indigo-400/20 to-transparent dark:from-indigo-400/10" />
          <div className="absolute bottom-32 left-16 w-0.5 h-28 bg-gradient-to-b from-sky-400/20 to-transparent dark:from-sky-400/10" />
          
          {/* Horizontal accent lines */}
          <div className="absolute top-24 left-3 w-12 h-0.5 bg-gradient-to-r from-cyan-400/30 via-sky-400/20 to-transparent dark:from-cyan-400/15 dark:via-sky-400/10" />
          <div className="absolute top-64 right-6 w-16 h-0.5 bg-gradient-to-r from-indigo-400/30 via-purple-400/20 to-transparent dark:from-indigo-400/15 dark:via-purple-400/10" />
          <div className="absolute bottom-48 left-5 w-14 h-0.5 bg-gradient-to-r from-sky-400/30 to-transparent dark:from-sky-400/15" />
          
          {/* Decorative dots */}
          <div className="absolute top-32 right-8 w-1.5 h-1.5 rounded-full bg-cyan-400/30 dark:bg-cyan-400/15" />
          <div className="absolute top-96 left-12 w-1 h-1 rounded-full bg-indigo-400/40 dark:bg-indigo-400/20" />
          <div className="absolute bottom-56 right-10 w-1.5 h-1.5 rounded-full bg-sky-400/30 dark:bg-sky-400/15" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/30 via-sky-500/30 to-indigo-500/30 dark:from-cyan-400/40 dark:via-sky-500/35 dark:to-indigo-500/35 shadow-lg shadow-cyan-500/20 dark:shadow-cyan-500/15 border border-cyan-400/50 dark:border-cyan-400/30">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/20 via-sky-400/10 to-indigo-500/10 blur-lg opacity-70 animate-[pulse_5s_ease-in-out_infinite]" />
              <Flame size={26} strokeWidth={2.5} className="relative text-cyan-500 dark:text-cyan-300" />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${labelVisible}`}>
              <p className="text-xs font-bold uppercase tracking-[0.4em] bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 dark:from-cyan-400 dark:via-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">BenchForge</p>
              <p className="text-sm font-bold text-cyan-600 dark:text-sky-300">Benchmark</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/40 dark:border-cyan-400/30 bg-gradient-to-br from-cyan-100/50 to-sky-100/50 dark:from-cyan-900/40 dark:to-sky-900/40 text-cyan-600 dark:text-cyan-400 transition-all hover:border-cyan-400/60 dark:hover:border-cyan-400/50 hover:shadow-md hover:shadow-cyan-500/20 xl:hidden"
          >
            <ChevronRight size={20} className={`${isSidebarOpen ? 'rotate-180' : ''} transition-transform`} />
          </button>
        </div>

        {/* Navigation divider */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent dark:via-cyan-400/20 mb-4" />

        <div className="flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navSections.map((section) => {
            return (
              <div key={section.title} className="space-y-2">
                <p className={`px-4 text-[10px] font-black uppercase tracking-[0.5em] bg-gradient-to-r from-cyan-500 to-sky-600 dark:from-cyan-400 dark:to-sky-400 bg-clip-text text-transparent ${labelVisible}`}>
                  {section.title}
                </p>
                <nav className="space-y-1.5">
                  {section.items
                    .map((item) => {
                      const Icon = item.icon
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.to !== '/submissions'}
                          className={({ isActive }) =>
                            `relative flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 group ${
                              isActive
                                ? 'bg-gradient-to-r from-cyan-400/30 to-sky-400/20 dark:from-cyan-500/40 dark:to-sky-500/30 text-cyan-700 dark:text-cyan-200 shadow-md shadow-cyan-500/15 border border-cyan-400/40 dark:border-cyan-400/30'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-cyan-200/20 hover:to-sky-200/10 dark:hover:from-cyan-900/30 dark:hover:to-sky-900/20 border border-transparent hover:border-cyan-400/20 dark:hover:border-cyan-400/15'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <motion.span
                                  layoutId="sidebar-active-border"
                                  className="absolute left-0 top-0 bottom-0 my-auto h-8 rounded-r-lg bg-gradient-to-b from-cyan-400 via-sky-400 to-indigo-500 shadow-lg shadow-cyan-500/40 dark:shadow-cyan-500/30"
                                  style={{ width: 3 }}
                                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                                />
                              )}
                              <div className={`relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                                isActive
                                  ? 'bg-gradient-to-br from-cyan-300/60 to-sky-300/40 dark:from-cyan-400/50 dark:to-sky-400/40 text-cyan-700 dark:text-cyan-100 shadow-md shadow-cyan-500/20'
                                  : 'bg-gradient-to-br from-slate-200/50 to-slate-100/50 dark:from-slate-700/50 dark:to-slate-600/50 text-slate-500 dark:text-slate-400 group-hover:from-cyan-200/60 group-hover:to-sky-200/40 dark:group-hover:from-cyan-600/50 dark:group-hover:to-sky-600/40'
                              }`}>
                                <Icon size={18} />
                              </div>
                              <span className={`relative z-10 transition-opacity duration-300 ${labelVisible}`}>{item.label}</span>
                            </>
                          )}
                        </NavLink>
                      )
                    })}
                </nav>
              </div>
            )
          })}
        </div>

        {/* Bottom action divider */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent dark:via-indigo-400/20 my-4" />

        {/* Bottom action buttons */}
        <div className="flex flex-col items-stretch gap-2 px-2">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 group border ${
                isActive
                  ? 'bg-gradient-to-r from-purple-400/30 to-pink-400/20 dark:from-purple-500/40 dark:to-pink-500/30 text-purple-700 dark:text-purple-200 shadow-md shadow-purple-500/15 border-purple-400/40 dark:border-purple-400/30'
                  : 'text-slate-600 dark:text-slate-300 border-slate-200/50 dark:border-slate-700/50 hover:bg-gradient-to-r hover:from-purple-200/20 hover:to-pink-200/10 dark:hover:from-purple-900/30 dark:hover:to-pink-900/20 hover:border-purple-400/20 dark:hover:border-purple-400/15'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-purple-300/60 to-pink-300/40 dark:from-purple-400/50 dark:to-pink-400/40 text-purple-700 dark:text-purple-100 shadow-md shadow-purple-500/20'
                    : 'bg-gradient-to-br from-slate-200/50 to-slate-100/50 dark:from-slate-700/50 dark:to-slate-600/50 text-slate-500 dark:text-slate-400 group-hover:from-purple-200/60 group-hover:to-pink-200/40 dark:group-hover:from-purple-600/50 dark:group-hover:to-pink-600/40'
                }`}>
                  <Settings2 size={16} />
                </div>
                <span className={`transition-opacity duration-300 ${labelVisible}`}>Settings</span>
              </>
            )}
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
            className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 group border bg-gradient-to-r from-red-200/30 to-orange-200/20 dark:from-red-900/40 dark:to-orange-900/30 text-red-700 dark:text-red-300 border-red-300/50 dark:border-red-700/50 hover:shadow-md hover:shadow-red-500/15 hover:from-red-200/50 hover:to-orange-200/35 dark:hover:from-red-900/60 dark:hover:to-orange-900/50"
          >
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-300/60 to-orange-300/40 dark:from-red-400/50 dark:to-orange-400/40 text-red-700 dark:text-red-100 shadow-sm shadow-red-500/20">
              <LogOut size={16} />
            </div>
            <span className={`transition-opacity duration-300 ${labelVisible}`}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
