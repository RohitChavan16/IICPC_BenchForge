import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export type AccentColor = 'indigo' | 'cyan' | 'blue' | 'emerald'

interface OperationsHeroProps {
  title: string
  description: string
  icon?: ReactNode
  badges?: Array<{
    label: string
    value: string
    color: 'slate' | 'cyan' | 'amber' | 'rose' | 'emerald' | 'indigo' | 'blue'
  }>
  actions?: ReactNode
  accentColor?: AccentColor
}

export function OperationsHero({
  title,
  description,
  icon,
  badges = [],
  actions,
  accentColor = 'indigo'
}: OperationsHeroProps) {
  // Map accent color to gradient classes
  const gradientMap = {
    indigo: 'dark:from-slate-900 dark:via-indigo-950/80 dark:to-slate-900 from-blue-50 via-indigo-50 to-violet-50',
    cyan: 'dark:from-slate-900 dark:via-cyan-950/80 dark:to-slate-900 from-cyan-50 via-sky-50 to-slate-50',
    blue: 'dark:from-slate-900 dark:via-blue-950/80 dark:to-slate-900 from-slate-50 via-blue-50 to-slate-50',
    emerald: 'dark:from-slate-900 dark:via-emerald-950/80 dark:to-slate-900 from-emerald-50 via-teal-50 to-slate-50',
  }

  const badgeColorMap = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  }

  const valueColorMap = {
    slate: 'text-slate-900 dark:text-slate-100',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    blue: 'text-blue-600 dark:text-blue-400',
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
      }}
      className={`relative w-full border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r ${gradientMap[accentColor]}`}
    >
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col gap-4 max-w-3xl">
            <div className="flex items-center gap-3">
              {icon && <div className={`text-${accentColor}-600 dark:text-${accentColor}-400`}>{icon}</div>}
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h1>
            </div>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              {description}
            </p>

            {badges.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {badges.map((badge, idx) => (
                  <div key={idx} className={`flex items-center gap-2 rounded-full px-3 py-1.5 border backdrop-blur-sm shadow-sm ${badgeColorMap[badge.color]}`}>
                    <span className="text-xs font-medium uppercase tracking-wider opacity-80">{badge.label}</span>
                    <span className={`text-sm font-bold ${valueColorMap[badge.color]}`}>{badge.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {actions && (
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
