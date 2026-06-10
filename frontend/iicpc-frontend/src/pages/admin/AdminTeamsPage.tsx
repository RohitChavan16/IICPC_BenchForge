import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboardEntries } from '@/services/api/leaderboardService';
import { useLeaderboardLiveState } from '@/hooks/useLeaderboardLiveState';

import { TeamsTopStatusBar } from '@/components/admin/teams/TeamsTopStatusBar';
import { TeamsHero } from '@/components/admin/teams/TeamsHero';
import { TeamsKPIStrip } from '@/components/admin/teams/TeamsKPIStrip';
import { TeamPerformanceSnapshot } from '@/components/admin/teams/TeamPerformanceSnapshot';
import { TeamDirectory } from '@/components/admin/teams/TeamDirectory';
import { CompetitionHealthOverview } from '@/components/admin/teams/CompetitionHealthOverview';
import { TeamsDistributionAnalytics } from '@/components/admin/teams/TeamsDistributionAnalytics';
import { TeamActivityCenter } from '@/components/admin/teams/TeamActivityCenter';
import { AdminActionCenter } from '@/components/admin/teams/AdminActionCenter';

export function AdminTeamsPage() {
  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboardEntries'],
    queryFn: fetchLeaderboardEntries,
    refetchInterval: 10000,
  });

  const rawEntries = leaderboardData?.items ?? [];
  const { liveEntries, activityFeed } = useLeaderboardLiveState(rawEntries);

  // Derived Admin Statistics
  const totalTeams = liveEntries.length; // In a real app, this might come from a dedicated /teams endpoint
  const activeTeams = liveEntries.filter(e => e.successRate >= 99.5).length;
  const inactiveTeams = totalTeams - activeTeams;
  const totalMembers = totalTeams * 3; // Placeholder if no real data
  const averageScore = totalTeams > 0 ? liveEntries.reduce((acc, curr) => acc + curr.finalScore, 0) / totalTeams : 0;
  const totalSubmissions = totalTeams * 4; // Placeholder proxy
  const totalBenchmarks = totalTeams > 0 ? liveEntries.reduce((acc, curr) => acc + curr.totalRequests, 0) : 0; // Using requests as proxy
  const topTeamScore = totalTeams > 0 ? Math.max(...liveEntries.map(e => e.finalScore)) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Top operational strip */}
      <TeamsTopStatusBar 
        totalTeams={totalTeams}
        activeTeams={activeTeams}
        totalMembers={totalMembers}
      />

      {/* SECTION: Hero */}
      <TeamsHero 
        totalTeams={totalTeams}
        activeTeams={activeTeams}
        totalMembers={totalMembers}
        totalSubmissions={totalSubmissions}
        totalBenchmarks={totalBenchmarks}
        topTeamScore={topTeamScore}
      />

      <div className="mx-auto mt-8 w-full max-w-7xl flex-1 space-y-12 px-4 sm:px-6 lg:px-8">
        {/* SECTION 1: Executive Summary */}
      <TeamsKPIStrip 
        totalTeams={totalTeams}
        activeTeams={activeTeams}
        inactiveTeams={inactiveTeams}
        totalMembers={totalMembers}
        averageScore={averageScore}
        benchmarksExecuted={totalBenchmarks}
        submissionsToday={activeTeams * 2} // proxy
        topTeamScore={topTeamScore}
      />

      {/* SECTION 6: Competition Health */}
      <CompetitionHealthOverview 
        totalRegisteredTeams={totalTeams}
        activeTeams={activeTeams}
        totalSubmissions={totalSubmissions}
        totalBenchmarks={totalBenchmarks}
      />

      {/* SECTION 3: Performance Snapshot */}
      <TeamPerformanceSnapshot entries={liveEntries} />

      {/* SECTION 2 & 4: Team Directory (with Detail Drawer) */}
      <TeamDirectory entries={liveEntries} />

      {/* SECTION 7: Distribution Analytics */}
      <TeamsDistributionAnalytics entries={liveEntries} />

      {/* SECTION 5: Activity Center */}
      <TeamActivityCenter activityFeed={activityFeed} />

      {/* SECTION 8: Action Center */}
      <AdminActionCenter />
      </div>
    </div>
  );
}
