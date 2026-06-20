package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	RedisReconnectAttempts = promauto.NewCounter(prometheus.CounterOpts{
		Name: "redis_reconnect_attempts_total",
		Help: "Total number of Redis reconnection attempts",
	})
	RedisConnectionFailures = promauto.NewCounter(prometheus.CounterOpts{
		Name: "redis_connection_failures_total",
		Help: "Total number of Redis connection failures",
	})
	RedisRecovery = promauto.NewCounter(prometheus.CounterOpts{
		Name: "redis_recovery_total",
		Help: "Total number of successful Redis recoveries",
	})
	DLQMessages = promauto.NewCounter(prometheus.CounterOpts{
		Name: "dlq_messages_total",
		Help: "Total number of messages sent to the Dead Letter Queue",
	})
	IdempotentSkips = promauto.NewCounter(prometheus.CounterOpts{
		Name: "idempotent_skips_total",
		Help: "Total number of messages skipped due to idempotency",
	})
	ConsumerRetries = promauto.NewCounter(prometheus.CounterOpts{
		Name: "consumer_retries_total",
		Help: "Total number of consumer processing retries",
	})
	ReclaimedMessages = promauto.NewCounter(prometheus.CounterOpts{
		Name: "reclaimed_messages_total",
		Help: "Total number of abandoned messages successfully reclaimed",
	})
	AbandonedPendingMessages = promauto.NewCounter(prometheus.CounterOpts{
		Name: "abandoned_pending_messages_total",
		Help: "Total number of pending messages detected as abandoned",
	})
)

