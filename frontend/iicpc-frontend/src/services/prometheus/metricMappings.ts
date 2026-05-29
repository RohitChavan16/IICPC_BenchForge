export type MetricMapping = {
  key: string
  label: string
  promql: string
  unit?: string
  // If true, run this promql even if metric name isn't explicitly discovered
  force?: boolean
}

export const METRIC_CATALOG: Record<string, MetricMapping[]> = {
  postgres: [
    { key: 'pg_stat_activity_count', label: 'Postgres: active connections', promql: 'pg_stat_activity_count', unit: 'connections' },
    { key: 'pg_database_size_bytes', label: 'Postgres: database size (bytes)', promql: 'pg_database_size_bytes', unit: 'bytes' },
    { key: 'pg_locks', label: 'Postgres: database locks', promql: 'pg_locks', unit: 'locks' },
    { key: 'postgres_exporter_up', label: 'Postgres exporter up', promql: 'up{job="postgres-exporter"}', unit: 'state' },
  ],
  redis: [
    { key: 'redis_connected_clients', label: 'Redis: connected clients', promql: 'redis_connected_clients', unit: 'clients' },
    { key: 'redis_memory_used_bytes', label: 'Redis: memory usage (bytes)', promql: 'redis_memory_used_bytes', unit: 'bytes' },
    { key: 'redis_commands_per_sec', label: 'Redis: commands/sec', promql: 'rate(redis_started_commands_total[1m])', unit: 'ops/s', force: true },
    { key: 'redis_exporter_up', label: 'Redis exporter up', promql: 'up{job="redis-exporter"}', unit: 'state' },
  ],
  cadvisor: [
    { key: 'container_cpu_total', label: 'Containers: total CPU (cores)', promql: 'sum(rate(container_cpu_usage_seconds_total[1m]))', unit: 'cores', force: true },
    { key: 'container_memory_total', label: 'Containers: total memory (bytes)', promql: 'sum(container_memory_usage_bytes)', unit: 'bytes', force: true },
  ],
  infrastructure: [
    { key: 'postgres_active_connections', label: 'Postgres: active connections', promql: 'pg_stat_activity_count', unit: 'connections' },
    { key: 'redis_connected_clients', label: 'Redis: connected clients', promql: 'redis_connected_clients', unit: 'clients' },
    { key: 'containers_cpu', label: 'Containers: CPU cores', promql: 'sum(rate(container_cpu_usage_seconds_total[1m]))', unit: 'cores', force: true },
  ],
}
