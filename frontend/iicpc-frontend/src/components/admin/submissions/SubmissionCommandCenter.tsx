import { Search, Filter, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';

interface SubmissionCommandCenterProps {
  filterText: string;
  setFilterText: (t: string) => void;
  statusFilter: string;
  setStatusFilter: (t: string) => void;
  totalResults: number;
}

export function SubmissionCommandCenter({
  filterText,
  setFilterText,
  statusFilter,
  setStatusFilter,
  totalResults
}: SubmissionCommandCenterProps) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Submission Command Center</h2>
        <p className="text-sm text-muted-foreground">Filter, search, and manage all active and historical submissions.</p>
      </div>

      <Card className="border-indigo-500/20 bg-gradient-to-r from-indigo-950/10 to-background p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Search submission ID, team, or language..."
                className="w-full rounded-full border border-border bg-background py-2 pl-11 pr-4 text-sm text-foreground outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
              <Filter size={14} />
              <span className="font-semibold text-foreground">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-foreground outline-none cursor-pointer"
              >
                <option value="all" className="bg-background">All Statuses</option>
                <option value="evaluating" className="bg-background">Evaluating</option>
                <option value="completed" className="bg-background">Completed</option>
                <option value="failed" className="bg-background">Failed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="text-muted-foreground">
              Showing <span className="font-bold text-foreground">{totalResults}</span> results
            </div>
            <button className="flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </Card>
    </motion.section>
  );
}
