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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Contextual User Status */}
        <div className="lg:col-span-1 flex flex-col justify-between p-5 rounded-2xl border border-border bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy size={64} />
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Rank</span>
            </div>
            <div className="text-4xl font-black text-amber-600 dark:text-amber-500 mb-6">
              #{data.currentUser.rank}
            </div>
          </div>
          
          <div className="space-y-3">
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

        {/* Top 5 Snapshot */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Rank</th>
                <th className="px-4 py-3 font-semibold">Team</th>
                <th className="px-4 py-3 font-semibold text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.topTeams.map((team, index) => {
                let rankStyle = "text-muted-foreground";
                if (team.rank === 1) rankStyle = "text-yellow-500 bg-yellow-500/10 border border-yellow-500/20";
                if (team.rank === 2) rankStyle = "text-slate-400 bg-slate-400/10 border border-slate-400/20";
                if (team.rank === 3) rankStyle = "text-orange-600 dark:text-orange-400 bg-orange-600/10 border border-orange-600/20";

                return (
                  <tr key={index} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${rankStyle}`}>
                        {team.rank}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground group-hover:text-amber-600 transition-colors">
                      {team.team}
                    </td>
                    <td className="px-4 py-3 font-bold text-right text-foreground">
                      {team.score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
      </div>
    </SectionWrapper>
  );
}
