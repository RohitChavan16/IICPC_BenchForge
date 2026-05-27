import { apiClient } from './apiClient'
import { endpoints } from './endpoints'
import { mockLogs } from '@/data/mock'
import type { LogEntry } from '@/types/api'

export async function fetchLogs(query = '', level?: string): Promise<LogEntry[]> {
  try {
    const response = await apiClient.get(endpoints.logs, {
      params: { q: query, level },
    })
    return response.data as LogEntry[]
  } catch (error) {
    return mockLogs.filter((log) => {
      const matchesQuery = query ? log.message.toLowerCase().includes(query.toLowerCase()) || log.source.toLowerCase().includes(query.toLowerCase()) : true
      const matchesLevel = level ? log.level === level : true
      return matchesQuery && matchesLevel
    })
  }
}

export async function fetchNotifications(): Promise<LogEntry[]> {
  try {
    const response = await apiClient.get(endpoints.notifications)
    return response.data as LogEntry[]
  } catch (error) {
    return mockLogs
  }
}
