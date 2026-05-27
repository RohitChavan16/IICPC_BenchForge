export interface MetricSnapshot {
  timestamp: string
  tps: number
  p50: number
  p90: number
  p99: number
  failureRate: number
  total: number
}

export interface BenchmarkSession {
  id: string
  name: string
  status: 'Running' | 'Completed' | 'Failed' | 'Queued'
  metrics: {
    tps: number
    p50: number
    p90: number
    p99: number
    successRate: number
  }
  workerCount: number
  duration: string
  startedAt: string
  updatedAt: string
  description: string
}

export interface WorkerStatus {
  id: string
  label: string
  status: 'Active' | 'Idle' | 'Degraded' | 'Offline'
  concurrency: number
  activeJobs: number
  failures: number
  cpu: number
  memory: number
  lastSeen: string
}

export interface InfrastructureMetric {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'flat'
  detail?: string
}

export interface RedisMetric {
  name: string
  value: string
  unit: string
  delta: string
}

export interface PostgresMetric {
  name: string
  value: string
  unit: string
  delta: string
}

export interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  source: string
  message: string
  service: string
}

export interface NotificationItem {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  createdAt: string
}

export interface HealthStatus {
  label: string
  status: 'Healthy' | 'Warning' | 'Critical'
  details: string
}
