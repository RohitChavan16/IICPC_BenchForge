import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboardEntries } from '@/services/api/leaderboardService';
import { useLeaderboardLiveState } from '@/hooks/useLeaderboardLiveState';
import type { LeaderboardEntry } from '@/types/api';

import { SubmissionsTopStatusBar } from '@/components/admin/submissions/SubmissionsTopStatusBar';
import { SubmissionsHero } from '@/components/admin/submissions/SubmissionsHero';
import { SubmissionsKPIStrip } from '@/components/admin/submissions/SubmissionsKPIStrip';
import { SubmissionCommandCenter } from '@/components/admin/submissions/SubmissionCommandCenter';
import { PipelineHealthCenter } from '@/components/admin/submissions/PipelineHealthCenter';
import { SubmissionPerformanceSnapshot } from '@/components/admin/submissions/SubmissionPerformanceSnapshot';
import { PlatformHealthOverview } from '@/components/admin/submissions/PlatformHealthOverview';
import { SubmissionDirectory } from '@/components/admin/submissions/SubmissionDirectory';
import { ReplayOperationsOverview } from '@/components/admin/submissions/ReplayOperationsOverview';
import { CompetitionSubmissionAnalytics } from '@/components/admin/submissions/CompetitionSubmissionAnalytics';
import { SubmissionActivityCenter } from '@/components/admin/submissions/SubmissionActivityCenter';
import { AdminSubmissionActionCenter } from '@/components/admin/submissions/AdminSubmissionActionCenter';

export function AdminSubmissionsPage() {
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<LeaderboardEntry | null>(null);

  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboardEntries'],
    queryFn: fetchLeaderboardEntries,
    refetchInterval: 10000,
  });

  const rawEntries = leaderboardData?.items ?? [];
  const { liveEntries, activityFeed } = useLeaderboardLiveState(rawEntries);

  // Derive global metrics safely
  const totalSubmissions = liveEntries.length;
  const successfulDeployments = totalSubmissions; // Proxied based on entry presence
  const failedDeployments = 0; // Proxied based on current api limits
  const runningPipelines = liveEntries.filter(e => e.finalScore === 0).length;
  const completedBenchmarks = liveEntries.filter(e => e.finalScore > 0).length;
  const replayReadyCount = completedBenchmarks; 
  const averageScore = totalSubmissions > 0 ? liveEntries.reduce((acc, curr) => acc + curr.finalScore, 0) / totalSubmissions : 0;
  const bestScore = totalSubmissions > 0 ? Math.max(...liveEntries.map(e => e.finalScore)) : 0;

  // Apply filters for the main directory
  const filteredEntries = liveEntries.filter(e => {
    // Text search
    const textMatch = !filterText || 
      e.submissionName.toLowerCase().includes(filterText.toLowerCase()) ||
      e.teamName.toLowerCase().includes(filterText.toLowerCase()) ||
      e.id.toLowerCase().includes(filterText.toLowerCase());

    if (!textMatch) return false;

    // Status filter
    if (statusFilter === 'all') return true;
    if (statusFilter === 'evaluating') return e.finalScore === 0;
    if (statusFilter === 'completed') return e.finalScore > 0 && e.successRate >= 99.5;
    if (statusFilter === 'failed') return e.successRate < 99.5;

    return true;
  }).sort((a, b) => b.finalScore - a.finalScore); // Default sort by score

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Top operational strip */}
      <SubmissionsTopStatusBar 
        totalSubmissions={totalSubmissions}
        runningPipelines={runningPipelines}
        completedBenchmarks={completedBenchmarks}
        failedSubmissions={liveEntries.filter(e => e.successRate < 99.5).length}
      />

      {/* Hero Section */}
      <SubmissionsHero 
        totalSubmissions={totalSubmissions}
        runningPipelines={runningPipelines}
        completedBenchmarks={completedBenchmarks}
        failedSubmissions={liveEntries.filter(e => e.successRate < 99.5).length}
        replayReady={replayReadyCount}
        bestScore={bestScore}
      />

      <div className="mx-auto mt-8 w-full max-w-7xl flex-1 space-y-12 px-4 sm:px-6 lg:px-8">
        {/* SECTION 1: Executive Summary */}
      <SubmissionsKPIStrip 
        totalSubmissions={totalSubmissions}
        successfulDeployments={successfulDeployments}
        failedDeployments={failedDeployments}
        runningPipelines={runningPipelines}
        completedBenchmarks={completedBenchmarks}
        replayReadyCount={replayReadyCount}
        averageScore={averageScore}
        bestSubmissionScore={bestScore}
      />

      {/* SECTION 12: Platform Health */}
      <PlatformHealthOverview entries={liveEntries} />

      {/* SECTION 4: Pipeline Health Center */}
      <PipelineHealthCenter entries={liveEntries} />

      {/* SECTION 5: Performance Snapshot */}
      <SubmissionPerformanceSnapshot entries={liveEntries} />

      {/* SECTION 2: Command Center */}
      <SubmissionCommandCenter 
        filterText={filterText}
        setFilterText={setFilterText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        totalResults={filteredEntries.length}
      />

      {/* SECTION 3 & 6 & 7: Directory & Drawer & Pipeline Timeline */}
      <SubmissionDirectory 
        entries={filteredEntries} 
        selectedSubmission={selectedSubmission}
        setSelectedSubmission={setSelectedSubmission}
      />

      {/* SECTION 8: Replay Operations */}
      <ReplayOperationsOverview entries={liveEntries} />

      {/* SECTION 9: Submission Analytics */}
      <CompetitionSubmissionAnalytics entries={liveEntries} />

      {/* SECTION 10: Activity Center */}
      <SubmissionActivityCenter activityFeed={activityFeed} />

      {/* SECTION 11: Admin Action Center */}
      <AdminSubmissionActionCenter />
      </div>
    </div>
  );
}
