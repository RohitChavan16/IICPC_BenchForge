import React, { useEffect, useState } from 'react';
import { SectionWrapper } from './SectionWrapper';
import { Trophy, ArrowUp, ArrowDown, Medal, User, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchTopLeaderboardEntries, fetchLeaderboardForTeam } from '@/services/api/leaderboardService';
import type { LeaderboardEntry } from '@/types/api';
import { useAuthStore } from '@/stores/useAuthStore';

export function LeaderboardSnapshot() {
  const [topEntries, setTopEntries] = useState<LeaderboardEntry[]>([]);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchLeaderboard = () => {
      fetchTopLeaderboardEntries().then(entries => {
        setTopEntries(entries);
        const teamName = user?.team || user?.name;
        if (teamName) {
          const found = entries.find(e => e.teamName === teamName);
          if (found) {
            setUserEntry(found);
          } else {
            fetchLeaderboardForTeam(teamName).then(data => {
              if (data.items.length > 0) setUserEntry(data.items[0]);
            }).catch(console.error);
          }
        }
      }).catch(console.error);
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const gapToNext = userEntry && userEntry.rank > 1 ? (
    topEntries.find(e => e.rank === userEntry.rank - 1)?.finalScore || 0
  ) - userEntry.finalScore : 0;

  const gapToTop10 = userEntry && userEntry.rank > 10 ? (
    topEntries.length >= 10 ? topEntries[9].finalScore - userEntry.finalScore : 0
  ) : 0;

  const data = {
    currentUser: {
      rank: userEntry ? userEntry.rank : '-',
      gapToNext: userEntry && userEntry.rank > 1 ? (gapToNext > 0 ? gapToNext.toFixed(0) : 'Unknown') : '-',
      gapToTop10: userEntry && userEntry.rank > 10 ? (gapToTop10 > 0 ? gapToTop10.toFixed(0) : 'Unknown') : '-'
    },
    topTeams: topEntries.slice(0, 5).map(e => ({
      rank: e.rank,
      team: e.teamName,
      score: e.finalScore.toLocaleString()
    }))
  };

  const actions = (
    <Link to="/leaderboard" className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg hover:bg-muted text-foreground transition-colors text-sm font-medium">
      Full Leaderboard <ChevronRight size={16} />
    </Link>
  );

  return (
    <SectionWrapper 
      title="Leaderboard Snapshot" 
      description="Your position and gap to top contenders."
      actions={actions}
      className="mb-8"
    >
      <div className="w-full">
        {userEntry ? (
          <div className="flex flex-col md:flex-row justify-between items-center p-6 rounded-2xl border border-border bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-1/2 -translate-y-1/2 right-8 opacity-10">
              <Trophy size={120} />
            </div>
            
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Rank</span>
              </div>
              <div className="text-5xl font-black text-amber-600 dark:text-amber-500">
                #{data.currentUser.rank}
              </div>
            </div>
            
            <div className="space-y-4 min-w-[250px] z-10 bg-background/50 backdrop-blur-sm p-4 rounded-xl border border-border/50">
              <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Gap to Next Rank</span>
                <span className="font-bold text-foreground">{data.currentUser.gapToNext} pts</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Gap to Top 10</span>
                <span className="font-bold text-foreground">{data.currentUser.gapToTop10} pts</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 rounded-2xl border border-dashed border-border bg-muted/20 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4 text-muted-foreground">
              <Medal size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2">No Rankings Available</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              You haven't placed on the leaderboard yet. Execute a successful benchmark run to secure your ranking!
            </p>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}
