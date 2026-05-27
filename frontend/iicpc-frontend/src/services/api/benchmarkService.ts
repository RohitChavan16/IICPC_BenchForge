import { apiClient } from './apiClient'
import { endpoints } from './endpoints'
import { mockBenchmarkSessions } from '@/data/mock'
import type { BenchmarkSession } from '@/types/api'

export interface BenchmarkListResponse {
  items: BenchmarkSession[]
  total: number
}

export async function fetchBenchmarkSessions(page = 1, pageSize = 10, filter = ''): Promise<BenchmarkListResponse> {
  try {
    const response = await apiClient.get(endpoints.benchmarkSessions, {
      params: { page, pageSize, q: filter },
    })
    return response.data as BenchmarkListResponse
  } catch (error) {
    const filtered = filter ? mockBenchmarkSessions.filter((item) => item.name.toLowerCase().includes(filter.toLowerCase())) : mockBenchmarkSessions
    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
    }
  }
}

export async function fetchBenchmarkDetail(id: string): Promise<BenchmarkSession | null> {
  try {
    const response = await apiClient.get(endpoints.benchmarkDetail(id))
    return response.data as BenchmarkSession
  } catch (error) {
    return mockBenchmarkSessions.find((session) => session.id === id) ?? null
  }
}
