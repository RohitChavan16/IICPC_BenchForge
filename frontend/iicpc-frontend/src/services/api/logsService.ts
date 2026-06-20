import { apiClient } from './apiClient'
import { endpoints } from './endpoints'
import type { LogEntry } from '@/types/api'

export async function fetchLogs(query = '', level?: string): Promise<LogEntry[]> {
  try {
    const response = await apiClient.get(endpoints.logs, {
      params: { q: query, level },
    })
    return response.data as LogEntry[]
  } catch (error) {
    return []
  }
}

export async function fetchNotifications(): Promise<LogEntry[]> {
  try {
    const response = await apiClient.get(endpoints.notifications)
    return response.data as LogEntry[]
  } catch (error) {
    return []
  }
}
