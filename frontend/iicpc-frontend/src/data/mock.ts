/**
 * @deprecated This file is no longer used. All mock data has been replaced with live production data integrations.
 */
import type { BenchmarkSession, InfrastructureMetric, LogEntry, MetricSnapshot, NotificationItem, PostgresMetric, RedisMetric, HealthStatus } from '@/types/api'

const now = new Date()

function timestamp(offsetMinutes = 0) {
  return new Date(now.getTime() - offsetMinutes * 60000).toISOString()
}

export const mockTelemetryHistory: MetricSnapshot[] = Array.from({ length: 20 }, (_, index) => ({
  timestamp: timestamp(20 - index),
  tps: 1050 + Math.sin(index / 2) * 90,
  p50: 38 + Math.cos(index / 3) * 8,
  p90: 92 + Math.sin(index / 4) * 15,
  p99: 170 + Math.sin(index / 2) * 25,
  failureRate: 1.3 + Math.abs(Math.sin(index / 3)) * 2,
  total: 12500 + index * 120,
}))

export const mockBenchmarkSessions: BenchmarkSession[] = [
  {
    id: 'bench-001',
    name: 'Flash Order Stress Test',
    status: 'Running',
    totalRequests: 100000, successCount: 98500, failureCount: 1500, p50: 38, p90: 92, p99: 180,
    workerCount: 48,
    duration: 744,
    createdAt: timestamp(15),
    startedAt: timestamp(15),
    updatedAt: timestamp(0),
  },
  {
    id: 'bench-002',
    name: 'Redis Stream Burst',
    status: 'Completed',
    totalRequests: 100000, successCount: 99100, failureCount: 900, p50: 42, p90: 96, p99: 210,
    workerCount: 32,
    duration: 557,
    createdAt: timestamp(90),
    startedAt: timestamp(90),
    updatedAt: timestamp(78),
  },
  {
    id: 'bench-003',
    name: 'Postgres Write Resilience',
    status: 'Failed',
    totalRequests: 100000, successCount: 94700, failureCount: 5300, p50: 55, p90: 113, p99: 255,
    workerCount: 24,
    duration: 365,
    createdAt: timestamp(210),
    startedAt: timestamp(210),
    updatedAt: timestamp(205),
  },
]

export const mockInfrastructureMetrics: InfrastructureMetric[] = [
  { label: 'Cluster CPU', value: '72%', change: '+4.2%', trend: 'up', detail: 'Slight pressure from concurrent benchmarks' },
  { label: 'Memory Utilization', value: '68%', change: '+2.1%', trend: 'up', detail: 'Redis and DB caches are active' },
  { label: 'Container Uptime', value: '99.98%', change: '0.0%', trend: 'flat', detail: 'No service restarts recorded' },
  { label: 'Network Egress', value: '120 Mbps', change: '+12%', trend: 'up', detail: 'Benchmark traffic growth' },
]

export const mockRedisMetrics: RedisMetric[] = [
  { name: 'Commands/sec', value: '19.4k', unit: 'ops', delta: '+9.2%' },
  { name: 'Connected Clients', value: '84', unit: 'clients', delta: '+1.2%' },
  { name: 'Memory Usage', value: '4.8 GB', unit: 'GB', delta: '+3.1%' },
  { name: 'Stream Lag', value: '128 ms', unit: 'ms', delta: '-12%' },
]

export const mockPostgresMetrics: PostgresMetric[] = [
  { name: 'Transaction Rate', value: '5.2k', unit: 'tx/s', delta: '+5.1%' },
  { name: 'Cache Hit', value: '98.3%', unit: '%', delta: '+0.4%' },
  { name: 'Connection Pool', value: '58/64', unit: 'active', delta: '+2' },
  { name: 'Write Latency', value: '12 ms', unit: 'ms', delta: '-1.8%' },
]

export const mockLogs: LogEntry[] = [
  { id: 'log-01', timestamp: timestamp(0), level: 'info', source: 'telemetry-service', message: 'Telemetry broadcast delivered to 14 clients.', service: 'telemetry-service' },
  { id: 'log-02', timestamp: timestamp(2), level: 'warn', source: 'bot-worker', message: 'Worker 02 reported transient timeout to mock exchange.', service: 'bot-worker' },
  { id: 'log-03', timestamp: timestamp(4), level: 'error', source: 'postgres', message: 'Lock contention exceeded threshold on metrics table.', service: 'postgres' },
  { id: 'log-04', timestamp: timestamp(6), level: 'info', source: 'mock-exchange', message: 'Order pipeline processed 15,200 requests in the last minute.', service: 'mock-exchange' },
]

export const mockNotifications: NotificationItem[] = [
  { id: 'note-01', title: 'Performance alert', description: 'P99 latency exceeded 180ms in the last interval.', severity: 'warning', createdAt: timestamp(2) },
  { id: 'note-02', title: 'Worker pool anomaly', description: 'Gamma Pool declined below 50% concurrency.', severity: 'info', createdAt: timestamp(15) },
  { id: 'note-03', title: 'Database health', description: 'Postgres cache hit remains above 98%.', severity: 'critical', createdAt: timestamp(25) },
]

export const mockHealthStatus: HealthStatus[] = [
  { label: 'Telemetry pipeline', status: 'Healthy', details: 'Realtime stream stable' },
  { label: 'Redis cluster', status: 'Healthy', details: 'No dropped events' },
  { label: 'Postgres cluster', status: 'Warning', details: 'Lock wait rising' },
  { label: 'Mock exchange', status: 'Healthy', details: 'Endpoint stable' },
]
