import { create } from 'zustand'
import type { UserProfile } from '@/types/user'

interface AuthState {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  login: (user: UserProfile, token: string) => void
  register: (user: UserProfile, token: string) => void
  logout: () => void
}

const savedUser = typeof window !== 'undefined' ? window.localStorage.getItem('benchforge_user') : null
const savedToken = typeof window !== 'undefined' ? window.localStorage.getItem('benchforge_token') : null

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken,
  isAuthenticated: Boolean(savedToken),
  login: (user, token) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('benchforge_user', JSON.stringify(user))
      window.localStorage.setItem('benchforge_token', token)
    }
    set({ user, token, isAuthenticated: true })
  },
  register: (user, token) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('benchforge_user', JSON.stringify(user))
      window.localStorage.setItem('benchforge_token', token)
    }
    set({ user, token, isAuthenticated: true })
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('benchforge_user')
      window.localStorage.removeItem('benchforge_token')
    }
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
