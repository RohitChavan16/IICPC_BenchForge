import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboardEntries } from '@/services/api/leaderboardService';
import { useLeaderboardLiveState } from '@/hooks/useLeaderboardLiveState';

import { LeaderboardTopStatusBar } from '@/components/admin/leaderboard/LeaderboardTopStatusBar';
import { LeaderboardAdminHero } from '@/components/admin/leaderboard/LeaderboardAdminHero';
import { CompetitionExecutiveSummary } from '@/components/admin/leaderboard/CompetitionExecutiveSummary';
import { LeaderboardCommandCenter } from '@/components/admin/leaderboard/LeaderboardCommandCenter';
import { AdminPodium } from '@/components/admin/leaderboard/AdminPodium';
import { AdminLeaderboardDirectory } from '@/components/admin/leaderboard/AdminLeaderboardDirectory';
import { CompetitionHealthOverview } from '@/components/admin/leaderboard/CompetitionHealthOverview';
import { LeaderboardMovementCenter } from '@/components/admin/leaderboard/LeaderboardMovementCenter';
import { AdminPerformanceAnalytics } from '@/components/admin/leaderboard/AdminPerformanceAnalytics';
import { LanguagePerformanceAnalytics } from '@/components/admin/leaderboard/LanguagePerformanceAnalytics';
import { CompetitionRecordCenter } from '@/components/admin/leaderboard/CompetitionRecordCenter';
import { LeaderboardInsightsCenter } from '@/components/admin/leaderboard/LeaderboardInsightsCenter';
import { LiveCompetitionActivity } from '@/components/admin/leaderboard/LiveCompetitionActivity';
import { ReplayImpactAnalytics } from '@/components/admin/leaderboard/ReplayImpactAnalytics';
import { AdminLeaderboardActionCenter } from '@/components/admin/leaderboard/AdminLeaderboardActionCenter';
import { ScoringExplanationCenter } from '@/components/admin/leaderboard/ScoringExplanationCenter';

export function AdminLeaderboardPage() {
  const [filterText, setFilterText] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');

  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboardEntries'],
    queryFn: fetchLeaderboardEntries,
    refetchInterval: 5000,
  });

  const rawEntries = leaderboardData?.items ?? [];
  const { liveEntries, activityFeed, volatility } = useLeaderboardLiveState(rawEntries);

  // Derive metrics
  const rankedTeams = liveEntries.length;
  const activeCompetitors = liveEntries.filter(e => e.tps > 100).length;
  const highestScore = rankedTeams > 0 ? Math.max(...liveEntries.map(e => e.finalScore)) : 0;
  const highestTps = rankedTeams > 0 ? Math.max(...liveEntries.map(e => e.tps)) : 0;
  const validP99s = liveEntries.filter(e => e.p99 > 0).map(e => e.p99);
  const lowestP99 = validP99s.length > 0 ? Math.min(...validP99s) : 0;
  const perfectCorrectnessCount = liveEntries.filter(e => e.successRate >= 100).length;
  const currentLeader = liveEntries[0]?.teamName || '';
  
  const averageScore = rankedTeams > 0 ? liveEntries.reduce((acc, curr) => acc + curr.finalScore, 0) / rankedTeams : 0;
  const averageTps = rankedTeams > 0 ? liveEntries.reduce((acc, curr) => acc + curr.tps, 0) / rankedTeams : 0;

  // Global platform proxy
  const totalTeamsSystemWide = Math.max(100, rankedTeams); // Proxy since we don't have a team endpoint

  // Filters
  const filteredEntries = useMemo(() => {
    return liveEntries.filter(e => {
      // Text search
      const textMatch = !filterText || 
        e.submissionName.toLowerCase().includes(filterText.toLowerCase()) ||
        e.teamName.toLowerCase().includes(filterText.toLowerCase()) ||
        e.id.toLowerCase().includes(filterText.toLowerCase());

      if (!textMatch) return false;

      // Language filter
      if (languageFilter !== 'all') {
        const subName = e.submissionName.toLowerCase();
        if (languageFilter === 'go' && !subName.includes('go')) return false;
        if (languageFilter === 'rust' && !subName.includes('rust')) return false;
        if (languageFilter === 'java' && !subName.includes('java')) return false;
        if (languageFilter === 'cpp' && !subName.includes('cpp') && !subName.includes('c++')) return false;
        if (languageFilter === 'python' && !subName.includes('python')) return false;
      }

      return true;
    });
  }, [liveEntries, filterText, languageFilter]);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Top operational strip */}
      <LeaderboardTopStatusBar 
        rankedTeams={rankedTeams}
        activeCompetitors={activeCompetitors}
      />

      {/* Hero Section */}
      <LeaderboardAdminHero 
        totalRanked={rankedTeams}
        activeCompetitors={activeCompetitors}
        highestScore={highestScore}
        lowestP99={lowestP99}
        highestTps={highestTps}
        perfectCorrectnessCount={perfectCorrectnessCount}
        currentLeader={currentLeader}
        volatility={volatility.level}
      />

      <div className="mx-auto mt-8 w-full max-w-7xl flex-1 space-y-12 px-4 sm:px-6 lg:px-8">
        {/* SECTION 1: Executive Summary */}
      <CompetitionExecutiveSummary 
        totalCompetitors={totalTeamsSystemWide}
        rankedTeams={rankedTeams}
        averageScore={averageScore}
        highestScore={highestScore}
        averageTps={averageTps}
        highestTps={highestTps}
        lowestP99={lowestP99}
        perfectCorrectnessCount={perfectCorrectnessCount}
      />

      {/* SECTION 5: Health Overview */}
      <CompetitionHealthOverview entries={liveEntries} totalTeamsSystemWide={totalTeamsSystemWide} />

      {/* SECTION 3: Podium */}
      <AdminPodium entries={liveEntries} />

      {/* SECTION 2: Command Center */}
      <LeaderboardCommandCenter 
        filterText={filterText}
        setFilterText={setFilterText}
        languageFilter={languageFilter}
        setLanguageFilter={setLanguageFilter}
        totalResults={filteredEntries.length}
      />

      {/* SECTION 4: Leaderboard Directory */}
      <AdminLeaderboardDirectory entries={filteredEntries} />

      {/* SECTION 6: Movement Center */}
      <LeaderboardMovementCenter entries={liveEntries} />

      {/* SECTION 11: Live Activity Feed */}
      <LiveCompetitionActivity activityFeed={activityFeed} />

      {/* SECTION 7: Performance Analytics */}
      <AdminPerformanceAnalytics entries={liveEntries} />

      {/* SECTION 8: Language Performance */}
      <LanguagePerformanceAnalytics entries={liveEntries} />

      {/* SECTION 9: Hall of Fame / Records */}
      <CompetitionRecordCenter entries={liveEntries} />

      {/* SECTION 10: Insights */}
      <LeaderboardInsightsCenter entries={liveEntries} />

      {/* SECTION 12: Replay Impact */}
      <ReplayImpactAnalytics entries={liveEntries} />

      {/* SECTION 13: Action Center */}
      <AdminLeaderboardActionCenter />

      {/* SECTION 14: Scoring Explanation */}
      <ScoringExplanationCenter />
      </div>
    </div>
  );
}
