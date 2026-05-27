import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const minimalRoutes = ['/', '/login', '/register']

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const hasAppNavigation = !minimalRoutes.includes(location.pathname)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="fixed inset-x-0 top-0 h-[420px] bg-radial-glow opacity-80 blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-full overflow-hidden">
        {hasAppNavigation ? <Sidebar /> : null}
        <div className="flex min-h-screen flex-1 flex-col xl:pl-[280px]">
          {hasAppNavigation ? <Topbar /> : null}
          <main className="relative flex-1 px-4 py-6 sm:px-6 xl:px-10">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
