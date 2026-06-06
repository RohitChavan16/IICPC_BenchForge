import { motion } from 'framer-motion'
import { Trophy, Settings, ArrowRight, Download } from 'lucide-react'

const topTeams = [
  { rank: 1, name: 'Team Alpha', score: 9850, tps: 5021, correctness: '100%' },
  { rank: 2, name: 'Team Beta', score: 9240, tps: 4890, correctness: '98%' },
  { rank: 3, name: 'Team Gamma', score: 8750, tps: 4120, correctness: '95%' },
  { rank: 4, name: 'Team Delta', score: 8100, tps: 3950, correctness: '94%' },
  { rank: 5, name: 'Team Epsilon', score: 7950, tps: 3800, correctness: '92%' },
]

export function LeaderboardSnapshot() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="flex flex-col h-full rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
    >
      <div className="border-b border-slate-200 p-4 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Trophy size={18} className="text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Leaderboard Snapshot</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Top performing teams currently</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium border border-transparent dark:border-slate-700">
            <Download size={14} />
            Export
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium border border-transparent dark:border-slate-700">
            <Settings size={14} />
            Settings
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 transition-colors text-xs font-medium border border-amber-200/50 dark:border-amber-500/20">
            View Details
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 font-semibold">Rank</th>
              <th className="px-4 py-3 font-semibold">Team</th>
              <th className="px-4 py-3 font-semibold text-right">Score</th>
              <th className="px-4 py-3 font-semibold text-right">TPS</th>
              <th className="px-4 py-3 font-semibold text-right">Correctness</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {topTeams.map((team, idx) => {
              const isGold = team.rank === 1
              const isSilver = team.rank === 2
              const isBronze = team.rank === 3
              
              return (
                <motion.tr 
                  key={team.rank}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + idx * 0.05 }}
                  className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isGold ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-300 dark:border-amber-500/50' :
                      isSilver ? 'bg-slate-200 text-slate-700 dark:bg-slate-400/20 dark:text-slate-300 border border-slate-300 dark:border-slate-400/50' :
                      isBronze ? 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-300 dark:border-orange-500/50' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {team.rank}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{team.name}</td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{team.score.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">{team.tps.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">{team.correctness}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
