export function Badge({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}) {
  const classes = {
    default: 'bg-white/5 text-slate-200',
    success: 'bg-emerald-500/10 text-emerald-300',
    warning: 'bg-amber-500/10 text-amber-300',
    danger: 'bg-rose-500/10 text-rose-300',
    info: 'bg-cyan-500/10 text-cyan-300',
  }

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${classes[variant]} ${className || ''}`}>{children}</span>
}
