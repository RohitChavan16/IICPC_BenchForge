import { apiClient } from './apiClient'
import { endpoints } from './endpoints'
import type { WorkerRuntimeStatus, WorkerStatus } from '@/types/api'

type RawWorkerStatus = {
  workerId?: string
  status?: string
  lastSeen?: string
  tps?: number
  p50?: number
  p90?: number
  p99?: number
  failureRate?: number
  total?: number
}

function normalizeStatus(status: string | undefined): WorkerRuntimeStatus {
  if (status === 'active') return 'Active'
  if (status === 'idle') return 'Idle'
  return 'Offline'
}

function normalizeWorker(worker: RawWorkerStatus): WorkerStatus {
  return {
    workerId: worker.workerId ?? 'unknown-worker',
    status: normalizeStatus(worker.status),
    lastSeen: worker.lastSeen ?? new Date(0).toISOString(),
    tps: worker.tps ?? 0,
    p50: worker.p50 ?? 0,
    p90: worker.p90 ?? 0,
    p99: worker.p99 ?? 0,
    failureRate: worker.failureRate ?? 0,
    total: worker.total ?? 0,
  }
}

export async function fetchWorkers(): Promise<WorkerStatus[]> {
  const response = await apiClient.get<RawWorkerStatus[]>(endpoints.workers)
  return response.data.map(normalizeWorker)
}
