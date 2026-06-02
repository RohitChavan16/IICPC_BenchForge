import { apiClient } from './apiClient'
import { endpoints } from './endpoints'
import { mockTelemetryHistory } from '@/data/mock'
import type { MetricSnapshot } from '@/types/api'

export async function fetchTelemetryHistory(): Promise<MetricSnapshot[]> {
  try {
    const response = await apiClient.get(endpoints.telemetryHistory)
    return response.data as MetricSnapshot[]
  } catch (error) {
    return mockTelemetryHistory
  }
}

export async function fetchTelemetrySummary(): Promise<MetricSnapshot> {
  try {
    const response = await apiClient.get(endpoints.telemetrySummary)
    return response.data as MetricSnapshot
  } catch (error) {
    return mockTelemetryHistory[mockTelemetryHistory.length - 1]
  }
}

export async function fetchBenchmarkTelemetryHistory(benchmarkId: string): Promise<MetricSnapshot[]> {
  try {
    const response = await apiClient.get(`${endpoints.telemetryHistory}?benchmarkId=${benchmarkId}`)
    return response.data as MetricSnapshot[]
  } catch (error) {
    return []
  }
}
