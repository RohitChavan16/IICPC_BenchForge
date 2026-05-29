import type { BenchmarkSession } from '@/types/api'
import { fetchBenchmarkSessions } from './benchmarkService'

export async function fetchAllBenchmarks(): Promise<BenchmarkSession[]> {
  const resp = await fetchBenchmarkSessions()
  return resp.items ?? []
}

export function computeTps(session: BenchmarkSession): number {
  if (!session.duration || session.duration <= 0) return 0
  return session.totalRequests / session.duration
}

export function computeSuccessRate(session: BenchmarkSession): number {
  if (!session.totalRequests || session.totalRequests === 0) return 0
  return (session.successCount / session.totalRequests) * 100
}
