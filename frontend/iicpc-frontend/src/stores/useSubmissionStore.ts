import { create } from 'zustand'
import type { Submission } from '@/services/api/submissionService'
import * as submissionService from '@/services/api/submissionService'

interface SubmissionState {
  activeSubmission: Submission | null
  submissionsHistory: Submission[]
  isLoading: boolean
  error: string | null

  fetchSubmissions: () => Promise<void>
  setActiveSubmission: (submission: Submission | null) => void
  updateSubmissionStatus: (id: string, status: string) => void
}

export const useSubmissionStore = create<SubmissionState>((set) => ({
  activeSubmission: null,
  submissionsHistory: [],
  isLoading: false,
  error: null,

  fetchSubmissions: async () => {
    set({ isLoading: true, error: null })
    try {
      const items = await submissionService.listSubmissions()
      set({ submissionsHistory: items, isLoading: false })
      
      // Determine active submission: the most recent one that is not completed or failed, 
      // or just the most recent one if they are all completed.
      if (items.length > 0) {
        // Sort by createdAt descending
        const sorted = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        const active = sorted.find(s => !['completed', 'failed'].includes(s.status.toLowerCase())) || sorted[0]
        set({ activeSubmission: active })
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch submissions', isLoading: false })
    }
  },

  setActiveSubmission: (submission) => {
    set({ activeSubmission: submission })
  },

  updateSubmissionStatus: (id, status) => {
    set((state) => {
      const history = state.submissionsHistory.map(sub => 
        sub.id === id ? { ...sub, status } : sub
      )
      
      const active = state.activeSubmission?.id === id 
        ? { ...state.activeSubmission, status } 
        : state.activeSubmission

      return { submissionsHistory: history, activeSubmission: active }
    })
  }
}))
