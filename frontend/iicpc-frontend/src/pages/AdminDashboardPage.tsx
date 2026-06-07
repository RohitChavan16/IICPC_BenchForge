import { useAuthStore } from '@/stores/useAuthStore'
import {
  WelcomeBanner,
  QuickActionsBar,
  GlobalKPICards,
  PlatformHealthCenter,
  QueueOperationsOverview,
  LiveActivityFeed,
  LeaderboardSnapshot,
  LatestSubmissions,
  InfrastructureSummary,
  JudgeDemoPanel,
  AdminGuidanceCenter
} from './admin/dashboard'
import { useQuery } from '@tanstack/react-query'
import { fetchBenchmarkSessions } from '@/services/api/benchmarkService'
import { MarketSimulationAnalytics } from '@/components/analytics/MarketSimulationAnalytics'
import { LiveBenchmarkCommandCenter } from '@/components/analytics/LiveBenchmarkCommandCenter'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'

export function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user)

  const { data: benchmarksData } = useQuery({ 
    queryKey: ['benchmarks'], 
    queryFn: fetchBenchmarkSessions 
  })
  
  const latestBenchmark = benchmarksData?.items?.[0]

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 0 & 1: Welcome Banner & Quick Actions */}
      <WelcomeBanner userName={user?.name} />
      <QuickActionsBar />

      {/* SECTION 2: Global KPI Cards */}
      <GlobalKPICards />

      {/* SECTIONS 3 & 4: Platform Health & Queue Operations */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        <PlatformHealthCenter />
        <QueueOperationsOverview />
      </div>

      {/* LIVE BENCHMARK COMMAND CENTER */}
      <LiveBenchmarkCommandCenter />
      
      {/* SECTION: Market Simulation Analytics */}
      <Card title="Global Market Simulation Analytics (v1.0 - Hackathon Mix)" description={latestBenchmark ? `Showing data for latest benchmark: ${latestBenchmark.id}` : "No benchmarks available"}>
        <div className="flex justify-end mb-4">
          <Link to="/submissions">
            <Button variant="secondary" size="sm" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              View Past Submissions & Personas
            </Button>
          </Link>
        </div>
        <div className="mt-4">
          {latestBenchmark ? (
            <MarketSimulationAnalytics benchmarkId={latestBenchmark.id} />
          ) : (
            <div className="p-8 text-center text-muted-foreground">No benchmark data available.</div>
          )}
        </div>
      </Card>

      {/* SECTIONS 5 & 6 & 7: Live Activity Feed, Latest Submissions, Leaderboard Snapshot */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        <div className="xl:col-span-1 h-full">
          <LiveActivityFeed />
        </div>
        <div className="xl:col-span-2 flex flex-col gap-6">
          <LatestSubmissions />
          <LeaderboardSnapshot />
        </div>
      </div>

      {/* SECTIONS 8 & 9: Infrastructure Summary & Live Benchmark Spotlight */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        <div className="xl:col-span-2 h-full">
          <InfrastructureSummary />
        </div>
        <div className="xl:col-span-1 h-full flex flex-col">
          <div className="flex-1">
            <JudgeDemoPanel />
          </div>
        </div>
      </div>

      {/* SECTION 10: Admin Guidance Center */}
      <AdminGuidanceCenter />
    </div>
  )
}

