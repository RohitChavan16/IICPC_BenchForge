import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';
import type { LeaderboardLiveStateEntry } from '@/hooks/useLeaderboardLiveState';
import { formatNumber } from '@/utils/formatters';

interface HallOfFameProps {
  entries: LeaderboardLiveStateEntry[];
}

interface RecordHolder {
  teamName: string;
  value: number;
  date: number;
  isNew: boolean;
}

interface Records {
  highestScore: RecordHolder | null;
  highestTps: RecordHolder | null;
  lowestP99: RecordHolder | null;
}

export function HallOfFame({ entries }: HallOfFameProps) {
  const [records, setRecords] = useState<Records>({
    highestScore: null,
    highestTps: null,
    lowestP99: null,
  });

  const prevEntriesLength = useRef(0);

  useEffect(() => {
    if (entries.length === 0) return;

    setRecords(current => {
      const newRecords = { ...current };
      let changed = false;
      const now = Date.now();

      // Highest Score
      const maxScoreEntry = entries.reduce((prev, curr) => (prev.finalScore > curr.finalScore ? prev : curr));
      if (!current.highestScore || maxScoreEntry.finalScore > current.highestScore.value) {
        newRecords.highestScore = {
          teamName: maxScoreEntry.teamName,
          value: maxScoreEntry.finalScore,
          date: now,
          isNew: prevEntriesLength.current > 0, // Only new if not first load
        };
        changed = true;
      }

      // Highest TPS
      const maxTpsEntry = entries.reduce((prev, curr) => (prev.tps > curr.tps ? prev : curr));
      if (!current.highestTps || maxTpsEntry.tps > current.highestTps.value) {
        newRecords.highestTps = {
          teamName: maxTpsEntry.teamName,
          value: maxTpsEntry.tps,
          date: now,
          isNew: prevEntriesLength.current > 0,
        };
        changed = true;
      }

      // Lowest P99
      const minP99Entry = entries.reduce((prev, curr) => (prev.p99 < curr.p99 ? prev : curr));
      if (!current.lowestP99 || minP99Entry.p99 < current.lowestP99.value) {
        newRecords.lowestP99 = {
          teamName: minP99Entry.teamName,
          value: minP99Entry.p99,
          date: now,
          isNew: prevEntriesLength.current > 0,
        };
        changed = true;
      }

      return changed ? newRecords : current;
    });

    prevEntriesLength.current = entries.length;
  }, [entries]);

  useEffect(() => {
    // Clear "NEW" flag after 5 seconds
    const timer = setTimeout(() => {
      setRecords(current => {
        let changed = false;
        const newRecords = { ...current };
        if (newRecords.highestScore?.isNew) { newRecords.highestScore.isNew = false; changed = true; }
        if (newRecords.highestTps?.isNew) { newRecords.highestTps.isNew = false; changed = true; }
        if (newRecords.lowestP99?.isNew) { newRecords.lowestP99.isNew = false; changed = true; }
        return changed ? newRecords : current;
      });
    }, 5000);
    return () => clearTimeout(timer);
  }, [records]);

  if (!records.highestScore) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Hall Of Fame</h2>
        <p className="text-sm text-muted-foreground">Historic records achieved across all benchmark executions.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: 'Highest Score Ever', record: records.highestScore, format: (v: number) => formatNumber(Math.round(v)) },
          { title: 'Highest TPS Ever', record: records.highestTps, format: (v: number) => `${formatNumber(Math.round(v))} TPS` },
          { title: 'Lowest P99 Ever', record: records.lowestP99, format: (v: number) => `${v.toFixed(0)} ms` },
        ].map((item, idx) => (
          <div key={idx} className="relative overflow-hidden rounded-[24px] border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-background p-6 shadow-xl">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
            
            <AnimatePresence>
              {item.record?.isNew && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="absolute right-4 top-4 flex items-center gap-1 rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black"
                >
                  <Sparkles size={12} /> NEW RECORD
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-amber-500/20 text-amber-500">
              <Crown size={20} />
            </div>
            
            <p className="text-sm font-medium text-amber-500/80">{item.title}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{item.record?.teamName}</p>
            <p className="mt-1 font-mono text-xl text-amber-400">{item.record ? item.format(item.record.value) : '—'}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
