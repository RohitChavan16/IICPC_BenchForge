import axios from 'axios'
import type { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/useAuthStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export interface ApiErrorPayload {
  message: string
  status?: number
  details?: unknown
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('benchforge_token')
      : null
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<Record<string, unknown>>) => {
    // Backend responses use `{ "error": "..." }` — extract that first.
    // Fall back to Axios default message if no structured body exists.
    const serverData = error.response?.data
    const serverMessage =
      (typeof serverData?.error === 'string' ? serverData.error : undefined) ??
      (typeof serverData?.message === 'string' ? serverData.message : undefined)

    const payload: ApiErrorPayload = {
      message: serverMessage ?? error.message,
      status: error.response?.status,
      details: serverData,
    }

    if (error.response?.status === 401) {
      const auth = useAuthStore.getState()
      auth.logout()
    }

    return Promise.reject(payload)
  },
)
