import { apiClient } from './apiClient'
import { endpoints } from './endpoints'
import { mockNotifications } from '@/data/mock'
import type { NotificationItem } from '@/types/api'

export async function fetchNotifications(): Promise<NotificationItem[]> {
  try {
    const response = await apiClient.get(endpoints.notifications)
    return response.data as NotificationItem[]
  } catch (error) {
    return mockNotifications
  }
}
