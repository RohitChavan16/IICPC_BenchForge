import axios from 'axios'

const PROMETHEUS_BASE = import.meta.env.VITE_PROMETHEUS_URL ??
  (typeof window !== 'undefined' ? `${window.location.protocol === 'https:' ? 'https' : 'http'}://${window.location.hostname}:9090` : 'http://localhost:9090')

const client = axios.create({
  baseURL: PROMETHEUS_BASE,
  timeout: 10000,
})

export type PrometheusVectorResult = {
  metric: Record<string, string>
  value: [number, string]
}

export type PrometheusMatrixResult = {
  metric: Record<string, string>
  values: Array<[number, string]>
}

export async function instantQuery(query: string): Promise<PrometheusVectorResult[]> {
  const res = await client.get('/api/v1/query', { params: { query } })
  if (res.data?.status !== 'success') throw new Error('Prometheus instant query failed')
  return (res.data.data.result as PrometheusVectorResult[])
}

export async function rangeQuery(query: string, start: number, end: number, step: number): Promise<PrometheusMatrixResult[]> {
  const res = await client.get('/api/v1/query_range', { params: { query, start, end, step } })
  if (res.data?.status !== 'success') throw new Error('Prometheus range query failed')
  return (res.data.data.result as PrometheusMatrixResult[])
}

export async function series(matchers: string[], start?: number, end?: number): Promise<Array<Record<string, string>>> {
  const params: Record<string, unknown> = { 'match[]': matchers }
  if (start) params.start = start
  if (end) params.end = end

  const res = await client.get('/api/v1/series', { params })
  if (res.data?.status !== 'success') throw new Error('Prometheus series query failed')
  return res.data.data as Array<Record<string, string>>
}

export async function labelValues(label: string): Promise<string[]> {
  const res = await client.get(`/api/v1/label/${encodeURIComponent(label)}/values`)
  if (res.data?.status !== 'success') throw new Error('Prometheus label values query failed')
  return res.data.data as string[]
}

export { PROMETHEUS_BASE }
