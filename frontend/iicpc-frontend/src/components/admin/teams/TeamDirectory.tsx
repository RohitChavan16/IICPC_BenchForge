import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Hash, ExternalLink } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/api';
import { formatNumber, formatPercent } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { TeamDetailDrawer } from './TeamDetailDrawer';

interface TeamDirectoryProps {
  entries: LeaderboardEntry[];
}

export function TeamDirectory({ entries }: TeamDirectoryProps) {
  const [filter, setFilter] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<LeaderboardEntry | null>(null);

  const filteredEntries = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return entries
      .filter((entry) => {
        if (!query) return true;
        return (
          entry.teamName.toLowerCase().includes(query) ||
          entry.id.toLowerCase().includes(query) ||
          entry.submissionName.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.rank - b.rank); // Default to rank order
  }, [filter, entries]);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Team Directory</h2>
        <p className="text-sm text-muted-foreground">Centralized view of all participating teams, their performance metrics, benchmark activity, and competition standing.</p>
      </div>

      <Card className="border-teal-500/20">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground0" />
              <input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Search team name, ID, or submission..."
                className="w-full rounded-3xl border border-border bg-background py-2.5 pl-11 pr-4 text-sm text-foreground outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 sm:w-96"
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredEntries.length}</span> team(s)
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-hidden rounded-[24px] border border-border bg-background">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Rank</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Team Info</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Score</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Correctness</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Joined / Created</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium text-right backdrop-blur-md">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, index) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={entry.id} 
                  onClick={() => setSelectedTeam(entry)}
                  className={`group cursor-pointer border-t border-border transition-colors hover:bg-teal-500/5 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                >
                  <td className="px-6 py-4 text-foreground font-semibold">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 group-hover:bg-teal-500/10 group-hover:text-teal-400">
                      #{entry.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground transition-colors group-hover:text-teal-400">{entry.teamName}</p>
                      <Badge variant={entry.successRate >= 99.5 ? 'success' : 'default'} className="text-[10px] h-4 py-0 px-1">
                        {entry.successRate >= 99.5 ? 'Active' : 'Evaluating'}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Hash size={12} /> <span className="font-mono truncate max-w-[120px]">{entry.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground">{formatNumber(entry.finalScore)}</td>
                  <td className="px-6 py-4 font-mono text-emerald-400">{formatPercent(entry.successRate)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="inline-flex items-center gap-1 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-teal-500/20"
                    >
                      View Details <ExternalLink size={14} />
                    </button>
                  </td>
                </motion.tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No matching teams found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <TeamDetailDrawer 
        team={selectedTeam} 
        isOpen={selectedTeam !== null} 
        onClose={() => setSelectedTeam(null)} 
      />
    </motion.section>
  );
}
