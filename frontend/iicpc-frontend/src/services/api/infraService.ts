import { apiClient } from './apiClient'
import type { HealthStatus, InfrastructureMetric, PostgresMetric, RedisMetric, WorkerStatus } from '@/types/api'

export async function fetchHealthStatus(): Promise<HealthStatus[]> {
  try {
    const res = await apiClient.get('/infrastructure/health')
    return res.data as HealthStatus[]
  } catch (err) {
    return []
  }
}

export async function fetchInfrastructureMetrics(): Promise<InfrastructureMetric[]> {
  try {
    const res = await apiClient.get('/infrastructure/summary')
    return res.data as InfrastructureMetric[]
  } catch (err) {
    return []
  }
}

export async function fetchRedisMetrics(): Promise<RedisMetric[]> {
  try {
    const res = await apiClient.get('/infrastructure/redis')
    return res.data as RedisMetric[]
  } catch (err) {
    return []
  }
}

export async function fetchPostgresMetrics(): Promise<PostgresMetric[]> {
  try {
    const res = await apiClient.get('/infrastructure/postgres')
    return res.data as PostgresMetric[]
  } catch (err) {
    return []
  }
}

export async function fetchWorkerStatus(): Promise<WorkerStatus[]> {
  // Try calling /workers endpoint from telemetry
  try {
    const res = await apiClient.get('/workers')
    return res.data as WorkerStatus[]
  } catch (err) {
    return []
  }
}
