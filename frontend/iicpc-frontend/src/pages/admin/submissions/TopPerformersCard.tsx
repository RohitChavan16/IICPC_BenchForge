import { motion } from 'framer-motion'
import { Trophy, HelpCircle, ArrowRight } from 'lucide-react'

const topPerformers = [
  { rank: 1, team: 'Team Alpha', tps: '5,021', correctness: '100%', score: 9850 },
  { rank: 2, team: 'Team Beta', tps: '4,890', correctness: '98%', score: 9240 },
  { rank: 3, team: 'Team Gamma', tps: '4,120', correctness: '95%', score: 8750 },
  { rank: 4, team: 'Team Delta', tps: '3,950', correctness: '94%', score: 8100 },
  { rank: 5, team: 'Team Epsilon', tps: '3,800', correctness: '92%', score: 7950 },
]

export function TopPerformersCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm h-full"
    >
      <div className="border-b border-slate-200 p-4 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy size={18} className="text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Top Performers
            <div className="group relative">
              <HelpCircle size={14} className="text-slate-400 hover:text-indigo-400 cursor-help transition-colors" />
              <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-slate-800 text-xs text-slate-200 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                Top 5 submissions based on final computed score.
              </div>
            </div>
          </h2>
        </div>
      </div>
      
      <div className="flex-1 p-0 overflow-y-auto">
        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {topPerformers.map((team, idx) => {
            const isGold = team.rank === 1
            const isSilver = team.rank === 2
            const isBronze = team.rank === 3
            
            return (
              <motion.div 
                key={team.rank}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + idx * 0.05 }}
                className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                    isGold ? 'bg-gradient-to-br from-amber-200 to-amber-500 text-amber-900 border border-amber-300' :
                    isSilver ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 border border-slate-300' :
                    isBronze ? 'bg-gradient-to-br from-orange-200 to-orange-500 text-orange-950 border border-orange-300' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-transparent dark:border-slate-700'
                  }`}>
                    {team.rank}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{team.team}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-medium text-slate-500 uppercase">TPS: {team.tps}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                      <span className="text-[10px] font-medium text-emerald-500 uppercase">{team.correctness}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">{team.score.toLocaleString()}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
      
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10 transition-colors">
          View Full Leaderboard
          <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  )
}
