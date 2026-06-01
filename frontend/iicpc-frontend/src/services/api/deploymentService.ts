import { apiClient } from './apiClient'
import { endpoints } from './endpoints'

export interface Deployment {
  id: string
  submissionId: string
  containerId?: string
  containerImage?: string
  hostPort?: number
  containerPort: number
  deploymentStatus: string
  deploymentLog?: string
  deployedAt?: string
  stoppedAt?: string
  createdAt: string
  updatedAt: string
}

export async function createDeployment(submissionId: string, containerPort?: number): Promise<Deployment> {
  const response = await apiClient.post(endpoints.deployments, {
    submissionId,
    containerPort
  })
  return response.data as Deployment
}

export async function getDeployment(id: string): Promise<Deployment> {
  const response = await apiClient.get(`${endpoints.deployments}/${id}`)
  return response.data as Deployment
}

export async function listDeployments(): Promise<{ items: Deployment[] }> {
  const response = await apiClient.get(endpoints.deployments)
  return response.data as { items: Deployment[] }
}

export async function stopDeployment(id: string): Promise<Deployment> {
  const response = await apiClient.post(`${endpoints.deployments}/${id}/stop`)
  return response.data as Deployment
}
