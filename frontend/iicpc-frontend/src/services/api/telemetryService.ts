import { apiClient } from './apiClient'
import { endpoints } from './endpoints'
import type { MetricSnapshot } from '@/types/api'

export async function fetchTelemetryHistory(): Promise<MetricSnapshot[]> {
  try {
    const response = await apiClient.get(endpoints.telemetryHistory)
    return response.data as MetricSnapshot[]
  } catch (error) {
    return []
  }
}

export async function fetchTelemetrySummary(): Promise<MetricSnapshot> {
  // Unused endpoint - gateway does not support /telemetry/summary
  // Use websocket getLatestSnapshot() instead
  throw new Error('fetchTelemetrySummary is not supported. Use WebSocket snapshot.')
}

export async function fetchBenchmarkTelemetryHistory(benchmarkId: string): Promise<MetricSnapshot[]> {
  try {
    const response = await apiClient.get(`${endpoints.telemetryHistory}?benchmarkId=${benchmarkId}`)
    return response.data as MetricSnapshot[]
  } catch (error) {
    return []
  }
}

export async function fetchPersonaAnalytics(benchmarkId: string): Promise<import('@/types/api').PersonaData[]> {
  try {
    const response = await apiClient.get(`/personas?benchmarkId=${benchmarkId}`)
    return response.data as import('@/types/api').PersonaData[]
  } catch (error) {
    return []
  }
}

export async function fetchBatchPersonaAnalytics(benchmarkIds: string[]): Promise<import('@/types/api').PersonaData[]> {
  if (!benchmarkIds.length) return [];
  try {
    const response = await apiClient.get(`/personas/batch?benchmarkIds=${benchmarkIds.join(',')}`)
    return response.data as import('@/types/api').PersonaData[]
  } catch (error) {
    return []
  }
}
