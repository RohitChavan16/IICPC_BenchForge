import { rangeQuery } from './prometheus'

export type TimeWindow = '1m' | '5m' | '15m'

function windowSeconds(windowKey: TimeWindow) {
  switch (windowKey) {
    case '1m':
      return 60
    case '5m':
      return 5 * 60
    case '15m':
      return 15 * 60
    default:
      return 60
  }
}

function chooseStep(windowSec: number) {
  // Choose step roughly to produce 60-120 points
  const desiredPoints = 80
  const step = Math.max(1, Math.floor(windowSec / desiredPoints))
  return step
}

export async function fetchPrometheusRange(promql: string, windowKey: TimeWindow) {
  const end = Math.floor(Date.now() / 1000)
  const windowSec = windowSeconds(windowKey)
  const start = end - windowSec
  const step = chooseStep(windowSec)

  const res = await rangeQuery(promql, start, end, step)
  return res
}
