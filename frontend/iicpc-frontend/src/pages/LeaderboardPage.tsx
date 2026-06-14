import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboardEntries } from '@/services/api/leaderboardService';
import { useLeaderboardLiveState } from '@/hooks/useLeaderboardLiveState';
import { useAuthStore } from '@/stores/useAuthStore';

// New specialized components
import { LeaderboardHero } from '@/components/leaderboard/LeaderboardHero';
import { Podium } from '@/components/leaderboard/Podium';
import { CompetitionPressureMeter } from '@/components/leaderboard/CompetitionPressureMeter';
import { RankingsTable } from '@/components/leaderboard/RankingsTable';
import { PerformanceTrends } from '@/components/leaderboard/PerformanceTrends';

import { LiveActivityFeed } from '@/components/leaderboard/LiveActivityFeed';
import { ExplanationCenter } from '@/components/leaderboard/ExplanationCenter';

type SortKey = 'rank' | 'finalScore' | 'tps' | 'successRate' | 'p99';

export function LeaderboardPage() {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rank');

  // Fetch leaderboard data (no background polling as requested)
  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboardEntries'],
    queryFn: fetchLeaderboardEntries,
  });

  const rawEntries = leaderboardData?.items ?? [];

  // Hook to handle live state updates, rank movements, volatility, and derived activity
  const { liveEntries, activityFeed, volatility } = useLeaderboardLiveState(rawEntries);

  const user = useAuthStore((state) => state.user);
  const userEntry = liveEntries.find((entry) => entry.teamName === user?.team);

  // Derive top entries for the podium and hero
  // We sort liveEntries by rank ascending for these components.
  const topEntries = [...liveEntries].sort((a, b) => a.rank - b.rank);
  const heroEntry = topEntries[0];

  return (
    <div className="mx-auto max-w-7xl space-y-16 pb-24">
      {/* Hero Section */}
      <LeaderboardHero topEntry={heroEntry} userEntry={userEntry} totalCompetitors={liveEntries.length} />

      {/* Podium */}
      <Podium topEntries={topEntries} />

      {/* Volatility Meter */}
      <CompetitionPressureMeter volatility={volatility} />

      {/* Enhanced Rankings Table */}
      <RankingsTable 
        entries={liveEntries} 
        filter={filter} 
        setFilter={setFilter} 
        sortKey={sortKey} 
        setSortKey={setSortKey} 
      />

      {/* Trends (Graceful fallback if no history payload exists yet) */}
      <PerformanceTrends historyData={[]} />


      {/* Activity Feed */}
      <LiveActivityFeed activityFeed={activityFeed} />

      {/* Explanations */}
      <ExplanationCenter />

    </div>
  );
}
