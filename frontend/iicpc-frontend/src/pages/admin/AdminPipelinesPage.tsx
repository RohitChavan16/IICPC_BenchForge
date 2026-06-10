import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboardEntries } from '@/services/api/leaderboardService';
import { useLeaderboardLiveState } from '@/hooks/useLeaderboardLiveState';

import { TopStatusBar } from '@/components/admin/pipelines/TopStatusBar';
import { PipelineOperationsHero } from '@/components/admin/pipelines/PipelineOperationsHero';
import { PipelineActionCenter } from '@/components/admin/pipelines/PipelineActionCenter';
import { PipelineLifecycleOverview } from '@/components/admin/pipelines/PipelineLifecycleOverview';
import { PipelineHealthDashboard } from '@/components/admin/pipelines/PipelineHealthDashboard';
import { PipelineAnalyticsCenter } from '@/components/admin/pipelines/PipelineAnalyticsCenter';
import { PipelineBottleneckDetection } from '@/components/admin/pipelines/PipelineBottleneckDetection';
import { LivePipelineFeed } from '@/components/admin/pipelines/LivePipelineFeed';
import { PipelineDirectory } from '@/components/admin/pipelines/PipelineDirectory';

export function AdminPipelinesPage() {
  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboardEntries'],
    queryFn: fetchLeaderboardEntries,
    refetchInterval: 5000,
  });

  const rawEntries = leaderboardData?.items ?? [];
  const { liveEntries, activityFeed } = useLeaderboardLiveState(rawEntries);

  // Derived metrics
  const runningPipelines = liveEntries.filter(e => e.finalScore === 0).length;
  const validationQueue = Math.floor(runningPipelines * 0.3); // Proxy
  const benchmarkQueue = runningPipelines - validationQueue; // Proxy
  const replayQueue = 5; // Proxy

  const activePipelines = runningPipelines;
  const successfulToday = liveEntries.filter(e => e.successRate >= 99.5).length;
  const failedToday = liveEntries.filter(e => e.finalScore > 0 && e.successRate < 99.5).length;
  const avgBuildTimeMs = 45000; // Proxy
  const avgValidationTimeMs = 5100; // Proxy
  const replaysGenerated = successfulToday; // Proxy

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Top operational strip */}
      <TopStatusBar 
        runningPipelines={runningPipelines}
        validationQueue={validationQueue}
        benchmarkQueue={benchmarkQueue}
        replayQueue={replayQueue}
      />

      <PipelineOperationsHero 
        activePipelines={activePipelines}
        successfulToday={successfulToday}
        failedToday={failedToday}
        avgBuildTimeMs={avgBuildTimeMs}
        avgValidationTimeMs={avgValidationTimeMs}
        replaysGenerated={replaysGenerated}
      />

      <div className="mx-auto mt-8 w-full max-w-7xl flex-1 space-y-12 px-4 sm:px-6 lg:px-8">

        <PipelineActionCenter />

        <PipelineLifecycleOverview entries={liveEntries} />

        <PipelineHealthDashboard entries={liveEntries} />

        <PipelineBottleneckDetection entries={liveEntries} />

        <PipelineAnalyticsCenter />

        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PipelineDirectory entries={liveEntries} />
          </div>
          <div className="lg:col-span-1">
            <LivePipelineFeed activityFeed={activityFeed} />
          </div>
        </div>

      </div>
    </div>
  );
}
