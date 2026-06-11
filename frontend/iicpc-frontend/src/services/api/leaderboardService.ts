import { apiClient } from './apiClient'
import { endpoints } from './endpoints'
import type { LeaderboardEntry } from '@/types/api'

export interface LeaderboardListResponse {
  items: LeaderboardEntry[]
  total: number
}

export async function fetchLeaderboardEntries(): Promise<LeaderboardListResponse> {
  const response = await apiClient.get(endpoints.leaderboard)
  const items = (response.data?.items ?? []) as LeaderboardEntry[]
  const total = response.data?.total ?? items.length
  return { items, total }
}

export async function fetchTopLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const response = await apiClient.get(endpoints.leaderboardTop)
  return (response.data?.items ?? []) as LeaderboardEntry[]
}

export async function fetchLeaderboardForTeam(team: string): Promise<LeaderboardListResponse> {
  const response = await apiClient.get(endpoints.leaderboardTeam(team))
  const items = (response.data?.items ?? []) as LeaderboardEntry[]
  return { items, total: items.length }
}

export async function fetchLeaderboardForBenchmark(benchmarkId: string): Promise<LeaderboardEntry> {
  const response = await apiClient.get(endpoints.leaderboardBenchmark(benchmarkId))
  return response.data as LeaderboardEntry
}
