import type { ReactNode } from 'react'

export function Card({
  title,
  description,
  children,
  className = '',
}: {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-glow backdrop-blur-xl ${className}`}>
      {title ? (
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/80">{title}</p>
            {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
          </div>
        </div>
      ) : null}
      {children}
    </section>
  )
}
