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

export function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user)

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

