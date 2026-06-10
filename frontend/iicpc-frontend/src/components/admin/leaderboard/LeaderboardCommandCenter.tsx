import { Search, Filter, RefreshCw, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';

interface LeaderboardCommandCenterProps {
  filterText: string;
  setFilterText: (t: string) => void;
  languageFilter: string;
  setLanguageFilter: (t: string) => void;
  totalResults: number;
}

export function LeaderboardCommandCenter({
  filterText,
  setFilterText,
  languageFilter,
  setLanguageFilter,
  totalResults
}: LeaderboardCommandCenterProps) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Leaderboard Command Center</h2>
        <p className="text-sm text-muted-foreground">Filter, search, and export active competition rankings.</p>
      </div>

      <Card className="border-amber-500/20 bg-gradient-to-r from-amber-950/10 to-background p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Search team name or ID..."
                className="w-full rounded-full border border-border bg-background py-2 pl-11 pr-4 text-sm text-foreground outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
              <Filter size={14} />
              <span className="font-semibold text-foreground">Lang:</span>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="bg-transparent text-sm text-foreground outline-none cursor-pointer"
              >
                <option value="all" className="bg-background">All Languages</option>
                <option value="go" className="bg-background">Go</option>
                <option value="rust" className="bg-background">Rust</option>
                <option value="java" className="bg-background">Java</option>
                <option value="cpp" className="bg-background">C++</option>
                <option value="python" className="bg-background">Python</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="text-muted-foreground">
              Showing <span className="font-bold text-foreground">{totalResults}</span> teams
            </div>
            <button className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 font-medium text-amber-400 transition-colors hover:bg-amber-500/20">
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="flex items-center gap-2 rounded-full border border-amber-500 bg-amber-500 px-4 py-2 font-medium text-black transition-colors hover:bg-amber-400">
              <Download size={14} /> Export
            </button>
          </div>
        </div>
      </Card>
    </motion.section>
  );
}
