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
import { WorkerMonitoringPage } from '@/pages/WorkerMonitoringPage'
import { InfrastructureMonitoringPage } from '@/pages/InfrastructureMonitoringPage'
import { RedisMonitoringPage } from '@/pages/RedisMonitoringPage'
import { PostgresMonitoringPage } from '@/pages/PostgresMonitoringPage'
import { LogsExplorerPage } from '@/pages/LogsExplorerPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

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
      <Route path="/admin/telemetry" element={<AdminRoute><LiveTelemetryPage /></AdminRoute>} />
      <Route path="/admin/workers" element={<AdminRoute><WorkerMonitoringPage /></AdminRoute>} />
      <Route path="/admin/infrastructure" element={<AdminRoute><InfrastructureMonitoringPage /></AdminRoute>} />
      <Route path="/admin/infrastructure/redis" element={<AdminRoute><RedisMonitoringPage /></AdminRoute>} />
      <Route path="/admin/infrastructure/postgres" element={<AdminRoute><PostgresMonitoringPage /></AdminRoute>} />
      <Route path="/admin/logs" element={<AdminRoute><LogsExplorerPage /></AdminRoute>} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
