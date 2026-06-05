import { apiClient } from './apiClient'
import { endpoints } from './endpoints'

export interface Submission {
  id: string
  teamName: string
  submissionName: string
  language: string
  status: string
  currentStage?: string
  stageStatus?: string
  failureReason?: string
  buildLog?: string
  startedAt?: string
  finishedAt?: string
  createdAt: string
  updatedAt: string
  correctnessScore?: number
  correctnessDetails?: any
}

function computeStatus(sub: any): string {
  if (sub.stageStatus === 'FAILED') return 'failed'
  if (sub.currentStage === 'BENCHMARK' && sub.stageStatus === 'SUCCESS') return 'completed'
  return sub.status
}

export async function createSubmission(data: FormData): Promise<Submission> {
  const response = await apiClient.post(endpoints.submissions, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  const sub = response.data as Submission
  return { ...sub, status: computeStatus(sub) }
}

export async function getSubmission(id: string): Promise<Submission> {
  const response = await apiClient.get(`${endpoints.submissions}/${id}`)
  const sub = response.data as Submission
  return { ...sub, status: computeStatus(sub) }
}

export async function listSubmissions(): Promise<Submission[]> {
  const response = await apiClient.get(endpoints.submissions)
  const items = response.data.items as Submission[] || []
  return items.map(sub => ({ ...sub, status: computeStatus(sub) }))
}
