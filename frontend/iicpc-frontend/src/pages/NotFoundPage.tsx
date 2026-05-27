import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center px-6 text-center">
      <div className="rounded-[40px] border border-white/10 bg-slate-950/80 p-10 shadow-[0_0_120px_rgba(10,25,41,0.25)]">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">404</p>
        <h1 className="mt-4 text-5xl font-semibold text-white">Page not found</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
          The route you are trying to reach does not exist. Return to the dashboard or use the navigation menu.
        </p>
        <Link to="/" className="mt-8 inline-flex rounded-3xl bg-cyan-400 px-8 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
