import React, { useState } from 'react';
import { SectionWrapper } from './SectionWrapper';
import { mockRecentSubmissions } from '@/data/mockDashboardData';
import { Badge } from '@/components/ui/Badge';
import { FileText, Play, Download, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function RecentSubmissionsTable() {
  const [filter, setFilter] = useState('All');
  
  const filters = ['All', 'Passed', 'Failed', 'Running'];
  const data = filter === 'All' ? mockRecentSubmissions : mockRecentSubmissions.filter(s => s.status === filter);

  const actions = (
    <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
      {filters.map(f => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            filter === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );

  return (
    <SectionWrapper 
      title="Recent Submissions" 
      description="Your latest code uploads and their scoring."
      actions={actions}
      className="mb-8"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-semibold">Submission</th>
              <th className="px-4 py-3 font-semibold">Language</th>
              <th className="px-4 py-3 font-semibold text-right">Score</th>
              <th className="px-4 py-3 font-semibold text-right">TPS</th>
              <th className="px-4 py-3 font-semibold text-right">P99</th>
              <th className="px-4 py-3 font-semibold text-center">Status</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 relative">
            <AnimatePresence>
              {data.map((sub) => (
                <motion.tr 
                  key={sub.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{sub.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{sub.language}</td>
                  <td className="px-4 py-3 font-bold text-right text-foreground">{sub.score}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{sub.tps}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{sub.p99}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={sub.status === 'Passed' ? 'success' : sub.status === 'Failed' ? 'danger' : 'warning'}>
                      {sub.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{sub.created}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors" title="View Report">
                        <FileText size={14} />
                      </button>
                      <button className="p-1.5 rounded bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white transition-colors" title="Replay">
                        <Play size={14} />
                      </button>
                      <button className="p-1.5 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors" title="Download">
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  <Search className="mx-auto mb-2 opacity-20" size={24} />
                  No submissions match the filter "{filter}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  );
}
