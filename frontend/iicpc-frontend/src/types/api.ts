export interface MetricSnapshot {
  timestamp: string
  tps: number
  p50: number
  p90: number
  p99: number
  failureRate: number
  total: number
  queueDepth: number
}

export type WorkerRuntimeStatus = 'Active' | 'Idle' | 'Offline'

export interface WorkerStatus {
  workerId: string
  status: WorkerRuntimeStatus
  lastSeen: string
  tps: number
  p50: number
  p90: number
  p99: number
  failureRate: number
  total: number
}

export interface WorkerMetricSnapshot extends MetricSnapshot {
  workerId: string
}

export type WorkerMetricMap = Record<string, WorkerMetricSnapshot>

export interface BenchmarkSession {
  id: string
  name: string
  status: 'Running' | 'Completed' | 'Failed' | 'Queued'
  workerCount: number
  submissionId?: string
  startedAt: string
  finishedAt?: string
  duration?: number
  totalRequests: number
  successCount: number
  failureCount: number
  p50: number
  p90: number
  p99: number
  metadata?: Record<string, unknown> | null
  queuePosition?: number
  failureReason?: string
  waitTimeSeconds?: number
  executionTimeSeconds?: number
  createdAt: string
  updatedAt: string
}

export interface LeaderboardEntry {
  id: string
  benchmarkId: string
  teamName: string
  submissionName: string
  deploymentId: string
  tps: number
  successRate: number
  p50: number
  p90: number
  p99: number
  totalRequests: number
  duration: number
  correctnessScore?: number
  concurrencyScore?: number
  finalScore: number
  rank: number
  createdAt: string
  updatedAt: string
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

export interface PersonaData {
  botType: string
  total: number
  successRate: number
  latency: number
  tps: number
}

export interface TracerStats {
  executed: number
  passed: number
  failed: number
}

export interface LiveRequest {
  requestId: string
  botType: string
  latency: number
  success: boolean
  workerId: string
  benchmarkId: string
}

export type PersonaMetricMap = Record<string, MetricSnapshot>

export interface ReplayInsight {
  bucket_index: number
  type: string
  message: string
}

export interface PersonaMetrics {
  tps: number
  p99: number
}

export interface ReplaySnapshot {
  progress_percent: number
  tps: number
  p50: number
  p90: number
  p99: number
  success_rate: number
  requests_processed: number
  requests_remaining: number
  persona_distribution: Record<string, number>
  persona_metrics: Record<string, PersonaMetrics>
}

export interface LifecycleEvent {
  phase: string
  timestamp: string
  status: string
}

export interface ReplayData {
  benchmark_id: string
  status: 'PENDING' | 'PENDING_RETRY' | 'PROCESSING' | 'READY' | 'FAILED'
  failure_reason?: string
  lifecycle_events: LifecycleEvent[]
  snapshots: ReplaySnapshot[]
  insights: ReplayInsight[]
}
