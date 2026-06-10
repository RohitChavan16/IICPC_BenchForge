import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboardEntries } from '@/services/api/leaderboardService';
import { useLeaderboardLiveState } from '@/hooks/useLeaderboardLiveState';

// New specialized components
import { LeaderboardHero } from '@/components/leaderboard/LeaderboardHero';
import { CompetitionSummary } from '@/components/leaderboard/CompetitionSummary';
import { Podium } from '@/components/leaderboard/Podium';
import { CompetitionPressureMeter } from '@/components/leaderboard/CompetitionPressureMeter';
import { RankingsTable } from '@/components/leaderboard/RankingsTable';
import { PerformanceAnalytics } from '@/components/leaderboard/PerformanceAnalytics';
import { CompetitiveInsights } from '@/components/leaderboard/CompetitiveInsights';
import { PerformanceTrends } from '@/components/leaderboard/PerformanceTrends';
import { LanguageBattle } from '@/components/leaderboard/LanguageBattle';
import { HallOfFame } from '@/components/leaderboard/HallOfFame';
import { LiveActivityFeed } from '@/components/leaderboard/LiveActivityFeed';
import { ExplanationCenter } from '@/components/leaderboard/ExplanationCenter';

type SortKey = 'rank' | 'finalScore' | 'tps' | 'successRate' | 'p99';

export function LeaderboardPage() {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rank');

  // Fetch leaderboard data (polled every 10s)
  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboardEntries'],
    queryFn: fetchLeaderboardEntries,
    refetchInterval: 10000,
  });

  const rawEntries = leaderboardData?.items ?? [];

  // Hook to handle live state updates, rank movements, volatility, and derived activity
  const { liveEntries, activityFeed, volatility } = useLeaderboardLiveState(rawEntries);

  // Derive top entries for the podium and hero
  // We sort liveEntries by rank ascending for these components.
  const topEntries = [...liveEntries].sort((a, b) => a.rank - b.rank);
  const heroEntry = topEntries[0];

  return (
    <div className="mx-auto max-w-7xl space-y-16 pb-24">
      {/* Hero Section */}
      <LeaderboardHero topEntry={heroEntry} totalCompetitors={liveEntries.length} />

      {/* KPI Strip */}
      <CompetitionSummary entries={liveEntries} />

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

      {/* Analytics */}
      <PerformanceAnalytics entries={liveEntries} />

      {/* Insights */}
      <CompetitiveInsights entries={liveEntries} />

      {/* Trends (Graceful fallback if no history payload exists yet) */}
      <PerformanceTrends historyData={[]} />

      {/* Language Battle */}
      <LanguageBattle entries={liveEntries} />

      {/* Live Hall Of Fame */}
      <HallOfFame entries={liveEntries} />

      {/* Activity Feed */}
      <LiveActivityFeed activityFeed={activityFeed} />

      {/* Explanations */}
      <ExplanationCenter />

    </div>
  );
}
