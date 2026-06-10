import { motion } from 'framer-motion';
import { Activity, Flame, Zap, Wind } from 'lucide-react';
import type { VolatilityLevel } from '@/hooks/useLeaderboardLiveState';

interface CompetitionPressureMeterProps {
  volatility: {
    level: VolatilityLevel;
    changedCount: number;
  };
}

export function CompetitionPressureMeter({ volatility }: CompetitionPressureMeterProps) {
  
  const getMeterConfig = () => {
    switch (volatility.level) {
      case 'HIGH':
        return {
          title: 'HIGH',
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          icon: <Flame className="text-red-500" size={24} />,
          message: `${volatility.changedCount} positions changed. The leaderboard is extremely volatile!`,
          barFill: 'w-full bg-red-500',
        };
      case 'MEDIUM':
        return {
          title: 'MEDIUM',
          color: 'text-amber-500',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          icon: <Zap className="text-amber-500" size={24} />,
          message: `${volatility.changedCount} positions changed. Steady competitive movement.`,
          barFill: 'w-2/3 bg-amber-500',
        };
      case 'LOW':
      default:
        return {
          title: 'LOW',
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          icon: <Wind className="text-emerald-500" size={24} />,
          message: volatility.changedCount === 0 
            ? 'No rank changes detected in the latest refresh.'
            : `${volatility.changedCount} position(s) changed. The leaderboard is relatively stable.`,
          barFill: 'w-1/3 bg-emerald-500',
        };
    }
  };

  const config = getMeterConfig();

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`relative overflow-hidden rounded-[24px] border ${config.border} ${config.bg} p-6`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-background/50 shadow-sm backdrop-blur-sm">
            {config.icon}
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Leaderboard Volatility</h2>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${config.color}`}>{config.title}</span>
              <Activity className={config.color} size={20} />
            </div>
          </div>
        </div>

        <div className="flex-1 sm:ml-8 sm:max-w-md">
          <p className="text-sm font-medium text-foreground">{config.message}</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-background/50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: config.barFill.split(' ')[0].replace('w-', '') === 'full' ? '100%' : config.barFill.split(' ')[0] === 'w-2/3' ? '66%' : '33%' }}
              className={`h-full rounded-full ${config.barFill.split(' ')[1]}`}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
