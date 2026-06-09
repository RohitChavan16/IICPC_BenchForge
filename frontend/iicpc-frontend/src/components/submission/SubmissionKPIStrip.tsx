import React from 'react'
import { Trophy, Zap, ShieldCheck, PlayCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface KPI {
  id: string
  label: string
  value: string | number
  trend: string
  icon: React.ElementType
  colorClass: string
}

interface SubmissionKPIStripProps {
  bestRank: number | null
  highestTps: number | null
  avgCorrectness: number | null
  replayCount: number
  completedCount: number
}

export function SubmissionKPIStrip({ bestRank, highestTps, avgCorrectness, replayCount, completedCount }: SubmissionKPIStripProps) {
  const replayPercent = completedCount > 0 ? Math.round((replayCount / completedCount) * 100) : null

  const kpis: KPI[] = [
    {
      id: 'rank',
      label: 'Best Global Rank',
      value: bestRank !== null ? `#${bestRank}` : '-',
      trend: bestRank !== null ? 'Top performer' : 'No data yet',
      icon: Trophy,
      colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    },
    {
      id: 'tps',
      label: 'Highest TPS Ever',
      value: highestTps !== null ? highestTps.toLocaleString() : '-',
      trend: highestTps !== null ? 'Peak throughput' : 'Awaiting benchmark',
      icon: Zap,
      colorClass: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      id: 'correctness',
      label: 'Avg Correctness',
      value: avgCorrectness !== null ? `${avgCorrectness.toFixed(1)}%` : '-',
      trend: avgCorrectness !== null ? 'Across deployments' : 'Awaiting validation',
      icon: ShieldCheck,
      colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'replay',
      label: 'Replay Availability',
      value: replayPercent !== null ? `${replayPercent}%` : '-',
      trend: replayPercent !== null ? 'Of completed runs' : 'No replays yet',
      icon: PlayCircle,
      colorClass: 'text-violet-500 bg-violet-500/10 border-violet-500/20'
    }
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {kpis.map((kpi) => (
        <motion.div 
          key={kpi.id} 
          variants={item}
          className="relative overflow-hidden bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1 z-10">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
              <p className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</p>
            </div>
            <div className={`p-2.5 rounded-xl border ${kpi.colorClass} group-hover:scale-110 transition-transform duration-300 z-10`}>
              <kpi.icon size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 z-10 relative">
            <span className="text-[11px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
              {kpi.trend}
            </span>
          </div>
          
          {/* Subtle background glow on hover */}
          <div className={`absolute -bottom-12 -right-12 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${kpi.colorClass.split(' ')[0].replace('text-', 'bg-')}`} />
        </motion.div>
      ))}
    </motion.div>
  )
}
