import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/api';
import { formatNumber, formatPercent } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SubmissionDetailDrawer } from './SubmissionDetailDrawer';

interface SubmissionDirectoryProps {
  entries: LeaderboardEntry[];
  selectedSubmission: LeaderboardEntry | null;
  setSelectedSubmission: (e: LeaderboardEntry | null) => void;
}

export function SubmissionDirectory({ entries, selectedSubmission, setSelectedSubmission }: SubmissionDirectoryProps) {
  
  const getLanguage = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('go')) return 'Go';
    if (n.includes('rust')) return 'Rust';
    if (n.includes('java')) return 'Java';
    if (n.includes('cpp') || n.includes('c++')) return 'C++';
    if (n.includes('python')) return 'Python';
    return 'Unknown';
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Submission Directory</h2>
        <p className="text-sm text-muted-foreground">Centralized view of all competition submissions, benchmark outcomes, validation results, and replay availability.</p>
      </div>

      <Card className="border-indigo-500/20">
        <div className="overflow-x-auto overflow-y-hidden rounded-[24px] border border-border bg-background">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Submission Info</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Team</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Language</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Status</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Score</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">TPS</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Correctness</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Created At</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium text-right backdrop-blur-md">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const lang = getLanguage(entry.submissionName);
                const isHealthy = entry.successRate >= 99.5;
                const isComplete = entry.finalScore > 0;
                
                return (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={entry.id} 
                    onClick={() => setSelectedSubmission(entry)}
                    className={`group cursor-pointer border-t border-border transition-colors hover:bg-indigo-500/5 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground transition-colors group-hover:text-indigo-400">{entry.submissionName}</p>
                      <div className="mt-1 text-xs text-muted-foreground font-mono truncate max-w-[150px]">{entry.id}</div>
                    </td>
                    <td className="px-6 py-4 text-foreground font-medium">{entry.teamName}</td>
                    <td className="px-6 py-4">
                      <Badge variant={lang !== 'Unknown' ? 'default' : 'info'} className="text-[10px] h-5 py-0 px-2">{lang}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          {isHealthy ? <CheckCircle2 size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-rose-500" />}
                          <span className={isHealthy ? 'text-emerald-400' : 'text-rose-400'}>{isHealthy ? 'Validation Passed' : 'Validation Failed'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          {isComplete ? <CheckCircle2 size={14} className="text-cyan-500" /> : <Clock size={14} className="text-amber-500" />}
                          <span className={isComplete ? 'text-cyan-400' : 'text-amber-400'}>{isComplete ? 'Benchmarked' : 'Evaluating'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">{formatNumber(entry.finalScore)}</td>
                    <td className="px-6 py-4 font-mono text-foreground">{formatNumber(entry.tps)}</td>
                    <td className="px-6 py-4 font-mono text-teal-400">{formatPercent(entry.successRate)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="inline-flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-indigo-500/20"
                      >
                        Details <ExternalLink size={14} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                    No submissions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      <SubmissionDetailDrawer 
        submission={selectedSubmission} 
        isOpen={selectedSubmission !== null} 
        onClose={() => setSelectedSubmission(null)} 
      />
    </motion.section>
  );
}
