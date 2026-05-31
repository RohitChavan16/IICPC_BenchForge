import { apiClient } from './apiClient'
import { endpoints } from './endpoints'
import type { UserProfile } from '@/types/user'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  team: string
  password: string
}

export interface AuthResponse {
  user: UserProfile
  token: string
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(endpoints.authLogin, credentials)
  return response.data
}

export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(endpoints.authRegister, credentials)
  return response.data
}

export async function fetchProfile(): Promise<UserProfile> {
  const response = await apiClient.get(endpoints.authProfile)
  return response.data as UserProfile
}
