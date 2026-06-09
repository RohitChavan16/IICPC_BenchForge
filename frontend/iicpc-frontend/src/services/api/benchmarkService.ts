import { apiClient } from './apiClient'
import { endpoints } from './endpoints'
import type { BenchmarkSession, ReplayData } from '@/types/api'

export interface BenchmarkListResponse {
  items: BenchmarkSession[]
  total: number
}

export async function fetchBenchmarkSessions(): Promise<BenchmarkListResponse> {
  const response = await apiClient.get(endpoints.benchmarkSessions)
  const items = (response.data?.items ?? []) as BenchmarkSession[]
  return {
    items,
    total: items.length,
  }
}

export async function fetchBenchmarkDetail(id: string): Promise<BenchmarkSession> {
  const response = await apiClient.get(endpoints.benchmarkDetail(id))
  return response.data as BenchmarkSession
}

export interface CreateBenchmarkPayload {
  name: string
  targetType: 'mock' | 'deployment'
  submissionId?: string
  deploymentId?: string
  workerCount: number
  totalRequests: number
}

export async function createBenchmark(payload: CreateBenchmarkPayload): Promise<BenchmarkSession> {
  const response = await apiClient.post(endpoints.benchmarkSessions, payload)
  return response.data as BenchmarkSession
}

export async function fetchBenchmarkReplay(id: string): Promise<ReplayData> {
  // Use a separate Axios client or the existing one depending on routing
  // Note: Telemetry runs on port 8081, assuming API gateway or Vite proxy handles /replay
  const response = await apiClient.get(endpoints.benchmarkReplay(id))
  return response.data as ReplayData
}
