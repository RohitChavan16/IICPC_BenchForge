import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardHomePage } from '@/pages/DashboardHomePage'
import { BenchmarkSessionsPage } from '@/pages/BenchmarkSessionsPage'
import { BenchmarkDetailPage } from '@/pages/BenchmarkDetailPage'
import { BenchmarkAnalyticsPage } from '@/pages/BenchmarkAnalyticsPage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'
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
      <Route path="/dashboard" element={<ProtectedRoute><DashboardHomePage /></ProtectedRoute>} />
      <Route path="/benchmarks" element={<ProtectedRoute><BenchmarkSessionsPage /></ProtectedRoute>} />
      <Route path="/benchmarks/analytics" element={<ProtectedRoute><BenchmarkAnalyticsPage /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
      <Route path="/benchmarks/:benchmarkId" element={<ProtectedRoute><BenchmarkDetailPage /></ProtectedRoute>} />
      <Route path="/telemetry" element={<ProtectedRoute><LiveTelemetryPage /></ProtectedRoute>} />
      <Route path="/workers" element={<ProtectedRoute><WorkerMonitoringPage /></ProtectedRoute>} />
      <Route path="/infrastructure" element={<ProtectedRoute><InfrastructureMonitoringPage /></ProtectedRoute>} />
      <Route path="/infrastructure/redis" element={<ProtectedRoute><RedisMonitoringPage /></ProtectedRoute>} />
      <Route path="/infrastructure/postgres" element={<ProtectedRoute><PostgresMonitoringPage /></ProtectedRoute>} />
      <Route path="/logs" element={<ProtectedRoute><LogsExplorerPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
