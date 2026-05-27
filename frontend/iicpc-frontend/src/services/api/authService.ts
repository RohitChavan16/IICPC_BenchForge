import { apiClient } from './apiClient'
import { endpoints } from './endpoints'
import type { UserProfile } from '@/types/user'

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: UserProfile
  token: string
}

const fallbackUser: UserProfile = {
  id: 'user-01',
  name: 'Avery Morgan',
  email: 'avery@benchforge.io',
  role: 'Platform SRE',
  team: 'Benchmark Ops',
}

export async function login(credentials: AuthCredentials): Promise<AuthResponse> {
  try {
    const response = await apiClient.post(endpoints.authLogin, credentials)
    return response.data as AuthResponse
  } catch (error) {
    return {
      user: fallbackUser,
      token: 'mock-jwt-token',
    }
  }
}

export async function register(credentials: AuthCredentials): Promise<AuthResponse> {
  try {
    const response = await apiClient.post(endpoints.authRegister, credentials)
    return response.data as AuthResponse
  } catch (error) {
    return {
      user: fallbackUser,
      token: 'mock-jwt-token',
    }
  }
}

export async function fetchProfile(): Promise<UserProfile> {
  try {
    const response = await apiClient.get(endpoints.authProfile)
    return response.data as UserProfile
  } catch (error) {
    return fallbackUser
  }
}
