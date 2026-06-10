import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardHomePage } from '@/pages/DashboardHomePage'
import { SubmissionPage } from '@/pages/SubmissionPage'
import { DeploymentPage } from '@/pages/DeploymentPage'
import { BenchmarkSessionsPage } from '@/pages/BenchmarkSessionsPage'
import { NewBenchmarkPage } from '@/pages/NewBenchmarkPage'
import { BenchmarkDetailPage } from '@/pages/BenchmarkDetailPage'
import { BenchmarkAnalyticsPage } from '@/pages/BenchmarkAnalyticsPage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'
import { LeaderboardDetailsPage } from '@/pages/LeaderboardDetailsPage'
import { SubmissionReportPage } from '@/pages/SubmissionReportPage'
import { LiveTelemetryPage } from '@/pages/LiveTelemetryPage'
import { InfrastructureMonitoringPage } from '@/pages/InfrastructureMonitoringPage'
import { RedisMonitoringPage } from '@/pages/RedisMonitoringPage'
import { PostgresMonitoringPage } from '@/pages/PostgresMonitoringPage'
import { LogsExplorerPage } from '@/pages/LogsExplorerPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { GrafanaMonitoringPage } from '@/pages/GrafanaMonitoringPage'
import { AdminSubmissionsPage } from '@/pages/admin/AdminSubmissionsPage'
import { AdminQueuePage } from '@/pages/admin/AdminQueuePage'
import { AdminWorkersPage } from '@/pages/admin/AdminWorkersPage'
import { AdminDeploymentsPage } from '@/pages/admin/AdminDeploymentsPage'
import { AdminTeamsPage } from '@/pages/admin/AdminTeamsPage'
import { AdminLeaderboardPage } from '@/pages/admin/AdminLeaderboardPage'
import { AdminPipelinesPage } from '@/pages/admin/AdminPipelinesPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function ComingSoonAdminPage() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <div className="text-indigo-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-100">Module Coming Soon</h2>
      <p className="text-slate-400 max-w-md text-center">
        This administration module is scheduled for development in the next phase of the platform architecture.
      </p>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      
      {/* Contestant/Common Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardHomePage /></ProtectedRoute>} />
      <Route path="/submit" element={<ProtectedRoute><SubmissionPage /></ProtectedRoute>} />
      <Route path="/submissions" element={<ProtectedRoute><SubmissionPage /></ProtectedRoute>} />
      <Route path="/deployments/new" element={<ProtectedRoute><DeploymentPage /></ProtectedRoute>} />
      <Route path="/benchmarks" element={<ProtectedRoute><BenchmarkSessionsPage /></ProtectedRoute>} />
      <Route path="/benchmarks/new" element={<ProtectedRoute><NewBenchmarkPage /></ProtectedRoute>} />
      <Route path="/benchmarks/analytics" element={<ProtectedRoute><BenchmarkAnalyticsPage /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
      <Route path="/leaderboard/:teamId" element={<ProtectedRoute><LeaderboardDetailsPage /></ProtectedRoute>} />
      <Route path="/submissions/:id/report" element={<ProtectedRoute><SubmissionReportPage /></ProtectedRoute>} />
      <Route path="/benchmarks/:benchmarkId" element={<ProtectedRoute><BenchmarkDetailPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="/admin/teams" element={<AdminRoute><AdminTeamsPage /></AdminRoute>} />
      <Route path="/admin/submissions" element={<AdminRoute><AdminSubmissionsPage /></AdminRoute>} />
      <Route path="/admin/leaderboard" element={<AdminRoute><AdminLeaderboardPage /></AdminRoute>} />
      <Route path="/admin/pipeline" element={<AdminRoute><AdminPipelinesPage /></AdminRoute>} />
      <Route path="/admin/queue" element={<AdminRoute><AdminQueuePage /></AdminRoute>} />
      <Route path="/admin/workers" element={<AdminRoute><AdminWorkersPage /></AdminRoute>} />
      <Route path="/admin/deployments" element={<AdminRoute><AdminDeploymentsPage /></AdminRoute>} />
      <Route path="/admin/infrastructure" element={<AdminRoute><InfrastructureMonitoringPage /></AdminRoute>} />
      <Route path="/admin/infrastructure/postgres" element={<AdminRoute><PostgresMonitoringPage /></AdminRoute>} />
      <Route path="/admin/infrastructure/redis" element={<AdminRoute><RedisMonitoringPage /></AdminRoute>} />
      <Route path="/admin/infrastructure/grafana" element={<AdminRoute><GrafanaMonitoringPage /></AdminRoute>} />
      <Route path="/admin/analytics/platform" element={<AdminRoute><ComingSoonAdminPage /></AdminRoute>} />
      <Route path="/admin/analytics/performance" element={<AdminRoute><ComingSoonAdminPage /></AdminRoute>} />
      <Route path="/admin/analytics/correctness" element={<AdminRoute><ComingSoonAdminPage /></AdminRoute>} />
      <Route path="/admin/control/scoring" element={<AdminRoute><ComingSoonAdminPage /></AdminRoute>} />
      <Route path="/admin/telemetry" element={<AdminRoute><LiveTelemetryPage /></AdminRoute>} />
      <Route path="/admin/monitoring/alerts" element={<AdminRoute><ComingSoonAdminPage /></AdminRoute>} />
      <Route path="/admin/monitoring/events" element={<AdminRoute><ComingSoonAdminPage /></AdminRoute>} />
      <Route path="/admin/logs" element={<AdminRoute><LogsExplorerPage /></AdminRoute>} />
      <Route path="/admin/profile" element={<AdminRoute><ComingSoonAdminPage /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><ComingSoonAdminPage /></AdminRoute>} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
