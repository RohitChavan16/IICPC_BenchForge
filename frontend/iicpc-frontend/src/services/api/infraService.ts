import { apiClient } from './apiClient'
import { endpoints } from './endpoints'
import { mockInfrastructureMetrics, mockPostgresMetrics, mockRedisMetrics, mockWorkerStatus, mockHealthStatus } from '@/data/mock'
import type { HealthStatus, InfrastructureMetric, PostgresMetric, RedisMetric, WorkerStatus } from '@/types/api'

export async function fetchHealthStatus(): Promise<HealthStatus[]> {
  try {
    const response = await apiClient.get(endpoints.infrastructure)
    return response.data as HealthStatus[]
  } catch (error) {
    return mockHealthStatus
  }
}

export async function fetchInfrastructureMetrics(): Promise<InfrastructureMetric[]> {
  try {
    const response = await apiClient.get(endpoints.infrastructure)
    return response.data as InfrastructureMetric[]
  } catch (error) {
    return mockInfrastructureMetrics
  }
}

export async function fetchRedisMetrics(): Promise<RedisMetric[]> {
  try {
    const response = await apiClient.get(endpoints.redis)
    return response.data as RedisMetric[]
  } catch (error) {
    return mockRedisMetrics
  }
}

export async function fetchPostgresMetrics(): Promise<PostgresMetric[]> {
  try {
    const response = await apiClient.get(endpoints.postgres)
    return response.data as PostgresMetric[]
  } catch (error) {
    return mockPostgresMetrics
  }
}

export async function fetchWorkerStatus(): Promise<WorkerStatus[]> {
  try {
    const response = await apiClient.get(endpoints.workers)
    return response.data as WorkerStatus[]
  } catch (error) {
    return mockWorkerStatus
  }
}
