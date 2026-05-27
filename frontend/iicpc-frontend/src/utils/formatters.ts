export function formatNumber(value: number) {
  return Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export function formatRelativeDate(timestamp: string) {
  const diff = Math.max(new Date().getTime() - new Date(timestamp).getTime(), 0)
  const minutes = Math.floor(diff / 60000)
  if (minutes === 0) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}
