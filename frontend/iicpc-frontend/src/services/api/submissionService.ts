import { apiClient } from './apiClient'
import { endpoints } from './endpoints'

export interface Submission {
  id: string
  teamName: string
  submissionName: string
  language: string
  status: string
  createdAt: string
  updatedAt: string
}

export async function createSubmission(data: FormData): Promise<Submission> {
  const response = await apiClient.post(endpoints.submissions, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data as Submission
}

export async function getSubmission(id: string): Promise<Submission> {
  const response = await apiClient.get(`${endpoints.submissions}/${id}`)
  return response.data as Submission
}
