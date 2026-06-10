import { motion } from 'framer-motion';
import { Users, Trophy, Target, Zap, Clock, ShieldCheck, Activity, BarChart3 } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';

interface CompetitionExecutiveSummaryProps {
  totalCompetitors: number;
  rankedTeams: number;
  averageScore: number;
  highestScore: number;
  averageTps: number;
  highestTps: number;
  lowestP99: number;
  perfectCorrectnessCount: number;
}

export function CompetitionExecutiveSummary({
  totalCompetitors,
  rankedTeams,
  averageScore,
  highestScore,
  averageTps,
  highestTps,
  lowestP99,
  perfectCorrectnessCount
}: CompetitionExecutiveSummaryProps) {
  const cards = [
    { title: 'Total Competitors', value: formatNumber(totalCompetitors), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { title: 'Ranked Teams', value: formatNumber(rankedTeams), icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { title: 'Average Score', value: formatNumber(averageScore), icon: Target, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { title: 'Highest Score', value: formatNumber(highestScore), icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { title: 'Average TPS', value: formatNumber(averageTps), icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { title: 'Highest TPS', value: formatNumber(highestTps), icon: Zap, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    { title: 'Lowest P99', value: lowestP99 > 0 ? `${lowestP99.toFixed(0)} ms` : '-', icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { title: 'Perfect Correctness', value: formatNumber(perfectCorrectnessCount), icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Competition Executive Summary</h2>
        <p className="text-sm text-muted-foreground">High-level KPIs tracking participation and overall competitive performance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        {cards.map((card, idx) => (
          <div key={idx} className={`group relative overflow-hidden rounded-[24px] border ${card.border} bg-background p-4 transition-colors hover:bg-muted/30`}>
            <div className="relative z-10 flex items-center justify-between">
              <div className={`grid h-8 w-8 place-items-center rounded-full ${card.bg} ${card.color}`}>
                <card.icon size={16} />
              </div>
            </div>
            <div className="relative z-10 mt-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground line-clamp-1" title={card.title}>{card.title}</p>
              <p className="mt-1 text-xl font-bold text-foreground">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
