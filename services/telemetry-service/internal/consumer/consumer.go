package consumer

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"os"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"

	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/aggregator"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/database"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/logger"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/metrics"
	ws "github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/websocket"
)

type Metric struct {
	RequestID    string            `json:"request_id"`
	TraceID      string            `json:"trace_id"`
	TraceContext map[string]string `json:"trace_context"`
	BotType      string            `json:"bot_type"`
	Latency      int64             `json:"latency"`
	Success      bool              `json:"success"`
	WorkerID     string            `json:"worker_id"`
	BenchmarkID  string            `json:"benchmark_id"`
	Token        string            `json:"token"`
}

type TracerStats struct {
	Executed int `json:"executed"`
	Passed   int `json:"passed"`
	Failed   int `json:"failed"`
}

func StartConsumer(
	ctx context.Context,
	rdb *redis.Client,
	db *pgxpool.Pool,
	agg *aggregator.Aggregator,
	workerAggs map[string]*aggregator.Aggregator,
	workerLastSeen map[string]time.Time,
	workerMu *sync.Mutex,
	hub *ws.Hub,
) {

	hostname, _ := os.Hostname()
	if hostname == "" {
		hostname = uuid.NewString()
	}
	consumerID := fmt.Sprintf("telemetry-consumer-%s", hostname)

	stopBroadcasterCh := make(chan struct{}, 1)

	// New tracking variables
	personaAggs := make(map[string]*aggregator.Aggregator)
	tracerStats := &TracerStats{}
	var recentRequests []Metric

	go startBroadcaster(ctx, rdb, agg, hub, workerAggs, workerLastSeen, workerMu, personaAggs, tracerStats, &recentRequests, stopBroadcasterCh)

	// Process pending messages first (0-0)
	processPendingMessages(ctx, rdb, db, agg, workerAggs, workerLastSeen, workerMu, personaAggs, tracerStats, &recentRequests, consumerID, stopBroadcasterCh)

	// START BACKGROUND RECOVERY LOOP
	go startRecoveryLoop(ctx, rdb, db, agg, workerAggs, workerLastSeen, workerMu, personaAggs, tracerStats, &recentRequests, consumerID, stopBroadcasterCh)

	backoff := 1 * time.Second
	maxBackoff := 30 * time.Second

	for {
        select {

	case <-ctx.Done():

		logger.Log.Info("Stopping telemetry consumer")

		return

	default:
	}
		streams, err := rdb.XReadGroup(
	        ctx,
			&redis.XReadGroupArgs{
				Group:    GroupName,
				Consumer: consumerID,
				Streams: []string{
					StreamName,
					">",
				},
				Count: 100,
				Block: 2 * time.Second,
			},
		).Result()

		if err != nil {
			if err == redis.Nil {
				backoff = 1 * time.Second // Reset backoff on successful read (even if empty)
				continue
			}

			metrics.RedisConnectionFailures.Inc()
			logger.Log.Error("Redis XReadGroup failed", "error", err)
			
			// Exponential backoff
			time.Sleep(backoff)
			backoff *= 2
			if backoff > maxBackoff {
				backoff = maxBackoff
			}
			
			// Add jitter
			jitter := time.Duration(rand.Int63n(int64(backoff) / 10))
			time.Sleep(jitter)
			continue
		}

		if backoff > 1 * time.Second {
			metrics.RedisRecovery.Inc()
			logger.Log.Info("Redis recovered")
		}
		backoff = 1 * time.Second

		for _, stream := range streams {

			for _, message := range stream.Messages {

				processMessage(
					ctx,
					rdb,
					db,
					agg,
					workerAggs,
					workerLastSeen,
					workerMu,
					personaAggs,
					tracerStats,
					&recentRequests,
					message,
					stopBroadcasterCh,
				)
			}
		}
	}
}

func processPendingMessages(
	ctx context.Context,
	rdb *redis.Client,
	db *pgxpool.Pool,
	agg *aggregator.Aggregator,
	workerAggs map[string]*aggregator.Aggregator,
	workerLastSeen map[string]time.Time,
	workerMu *sync.Mutex,
	personaAggs map[string]*aggregator.Aggregator,
	tracerStats *TracerStats,
	recentRequests *[]Metric,
	consumerID string,
	stopBroadcasterCh chan struct{},
) {
	for {
		streams, err := rdb.XReadGroup(ctx, &redis.XReadGroupArgs{
			Group:    GroupName,
			Consumer: consumerID,
			Streams:  []string{StreamName, "0-0"},
			Count:    100,
		}).Result()

		if err != nil && err != redis.Nil {
			logger.Log.Error("Failed to read pending messages", "error", err)
			time.Sleep(2 * time.Second)
			continue
		}

		if err == redis.Nil || len(streams) == 0 || len(streams[0].Messages) == 0 {
			logger.Log.Info("Finished processing pending messages")
			break
		}

		for _, message := range streams[0].Messages {
			processMessage(ctx, rdb, db, agg, workerAggs, workerLastSeen, workerMu, personaAggs, tracerStats, recentRequests, message, stopBroadcasterCh)
		}
	}
}

func startRecoveryLoop(
	ctx context.Context,
	rdb *redis.Client,
	db *pgxpool.Pool,
	agg *aggregator.Aggregator,
	workerAggs map[string]*aggregator.Aggregator,
	workerLastSeen map[string]time.Time,
	workerMu *sync.Mutex,
	personaAggs map[string]*aggregator.Aggregator,
	tracerStats *TracerStats,
	recentRequests *[]Metric,
	consumerID string,
	stopBroadcasterCh chan struct{},
) {
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			logger.Log.Info("Stopping recovery loop")
			return
		case <-ticker.C:
			// 1. Get pending messages idle for > 5 mins
			pendingArgs := &redis.XPendingExtArgs{
				Stream: StreamName,
				Group:  GroupName,
				Start:  "-",
				End:    "+",
				Count:  100,
				Idle:   5 * time.Minute,
			}
			
			pending, err := rdb.XPendingExt(ctx, pendingArgs).Result()
			if err != nil {
				logger.Log.Error("Failed to check pending messages", "error", err)
				continue
			}

			if len(pending) == 0 {
				continue
			}

			var msgIDs []string
			for _, p := range pending {
				metrics.AbandonedPendingMessages.Inc()
				msgIDs = append(msgIDs, p.ID)
			}

			// 2. Claim messages
			claimArgs := &redis.XClaimArgs{
				Stream:   StreamName,
				Group:    GroupName,
				Consumer: consumerID,
				MinIdle:  5 * time.Minute,
				Messages: msgIDs,
			}
			
			claimed, err := rdb.XClaim(ctx, claimArgs).Result()
			if err != nil {
				logger.Log.Error("Failed to claim abandoned messages", "error", err)
				continue
			}

			// 3. Process claimed messages
			for _, message := range claimed {
				// Find matching XPendingExt struct for logs
				var p redis.XPendingExt
				for _, pen := range pending {
					if pen.ID == message.ID {
						p = pen
						break
					}
				}

				logger.Log.Info(
					"Reclaiming abandoned message",
					"consumer_group", GroupName,
					"original_consumer", p.Consumer,
					"reclaimed_message_id", message.ID,
					"idle_duration", p.Idle.String(),
				)

				processMessage(ctx, rdb, db, agg, workerAggs, workerLastSeen, workerMu, personaAggs, tracerStats, recentRequests, message, stopBroadcasterCh)
				metrics.ReclaimedMessages.Inc()
			}
		}
	}
}

func processMessage(
	ctx context.Context,
	rdb *redis.Client,
	db *pgxpool.Pool,
	agg *aggregator.Aggregator,
	workerAggs map[string]*aggregator.Aggregator,
	workerLastSeen map[string]time.Time,
	workerMu *sync.Mutex,
	personaAggs map[string]*aggregator.Aggregator,
	tracerStats *TracerStats,
	recentRequests *[]Metric,
	message redis.XMessage,
	stopBroadcasterCh chan struct{},
) {

	raw, ok := message.Values["metric"].(string)

	if !ok {
		return
	}

	var metric Metric

	err := json.Unmarshal(
		[]byte(raw),
		&metric,
	)

	if err != nil {
		return
	}

	if metric.BotType == "tracer" {
		traceCtx := otel.GetTextMapPropagator().Extract(ctx, propagation.MapCarrier(metric.TraceContext))
		tracer := otel.Tracer("telemetry-service")
		_, span := tracer.Start(traceCtx, "process_tracer_metric")
		defer span.End()

		logger.Log.Info("Processed tracer metric",
			"trace_id", metric.TraceID,
			"benchmark_id", metric.BenchmarkID,
			"request_id", metric.RequestID,
			"success", metric.Success,
			"trace_context", metric.TraceContext,
		)
	}

	workerSecret := os.Getenv("WORKER_SECRET")
	if workerSecret != "" {
		token, err := jwt.Parse(metric.Token, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return []byte(workerSecret), nil
		})
		if err != nil || !token.Valid {
			logger.Log.Error("Invalid worker JWT", "error", err, "metric", metric)
			// reject metric
			return
		}
	}

	if metric.BotType == "system_control" && metric.WorkerID == "STOP_STREAM" {
		select {
		case stopBroadcasterCh <- struct{}{}:
		default:
		}
		
		// Insert PENDING status idempotently
		database.InsertReplayStatus(db, metric.BenchmarkID, "PENDING")

		// Acknowledge stream message immediately to prevent reprocessing on crash
		rdb.XAck(ctx, StreamName, GroupName, message.ID)
		return
	}

	// Phase 1 & 2: Idempotency & DLQ Loop
	retryCount := 0
	maxRetries := 3
	var inserted bool

	for retryCount <= maxRetries {
		var err error
		inserted, err = database.InsertMetric(
			db,
			database.Metric{
				RequestID:   metric.RequestID,
				BotType:     metric.BotType,
				WorkerID:    metric.WorkerID,
				BenchmarkID: metric.BenchmarkID,
				Latency:     metric.Latency,
				Success:     metric.Success,
			},
		)

		if err != nil {
			logger.Log.Error("DB insert failed", "error", err, "retry", retryCount)
			metrics.ConsumerRetries.Inc()
			retryCount++
			time.Sleep(time.Duration(retryCount) * time.Second)
			continue
		}
		break
	}

	if retryCount > maxRetries {
		// DLQ Trigger: Permanent DB failure after max retries
		metrics.DLQMessages.Inc()
		dlqPayload, _ := json.Marshal(map[string]interface{}{
			"original_event": raw,
			"error":          "Max retries exceeded for DB insert",
			"retry_count":    retryCount,
			"timestamp":      time.Now(),
		})
		
		rdb.XAdd(ctx, &redis.XAddArgs{
			Stream: "telemetry_dlq",
			Values: map[string]interface{}{"payload": string(dlqPayload)},
		})
		
		// ACK original message so it doesn't block the stream
		rdb.XAck(ctx, StreamName, GroupName, message.ID)
		return
	}

	if !inserted {
		// Idempotent Skip
		metrics.IdempotentSkips.Inc()
		rdb.XAck(ctx, StreamName, GroupName, message.ID)
		return
	}
    
	// Update memory aggregators ONLY AFTER successful unique DB insert
	agg.AddMetric(
		float64(metric.Latency),
		metric.Success,
	)

	workerMu.Lock()
	// per-worker aggregator and last seen
	if metric.WorkerID != "" {
		wa, ok := workerAggs[metric.WorkerID]
		if !ok {
			wa = aggregator.NewAggregator()
			workerAggs[metric.WorkerID] = wa
		}
		workerLastSeen[metric.WorkerID] = time.Now()
		wa.AddMetric(float64(metric.Latency), metric.Success)
	}

	if metric.BotType == "tracer" {
		tracerStats.Executed++
		if metric.Success {
			tracerStats.Passed++
		} else {
			tracerStats.Failed++
		}
	} else {
		pa, ok := personaAggs[metric.BotType]
		if !ok {
			pa = aggregator.NewAggregator()
			personaAggs[metric.BotType] = pa
		}
		pa.AddMetric(float64(metric.Latency), metric.Success)
	}

	// add to recent requests ring buffer (keep last 20)
	*recentRequests = append(*recentRequests, metric)
	if len(*recentRequests) > 20 {
		*recentRequests = (*recentRequests)[1:]
	}

	workerMu.Unlock()

	err = rdb.XAck(
		ctx,
		StreamName,
		GroupName,
		message.ID,
	).Err()

	if err != nil {
		logger.Log.Error(
			"Redis ACK failed",
			"error",
			err,
		)
	}
}

func startBroadcaster(
	ctx context.Context,
	rdb *redis.Client,
	agg *aggregator.Aggregator,
	hub *ws.Hub,
	workerAggs map[string]*aggregator.Aggregator,
	workerLastSeen map[string]time.Time,
	workerMu *sync.Mutex,
	personaAggs map[string]*aggregator.Aggregator,
	tracerStats *TracerStats,
	recentRequests *[]Metric,
	stopBroadcasterCh chan struct{},
) {

	ticker := time.NewTicker(1 * time.Second)
	paused := false

	for {

	select {

	case <-ctx.Done():

		logger.Log.Info("Stopping broadcaster")

		ticker.Stop()

		return
	
	case <-stopBroadcasterCh:
		// Benchmark stopped: emit one final snapshot with TPS=0 and pause streaming.
		paused = true
		agg.Reset()
		workerMu.Lock()
		for id, wa := range workerAggs {
			wa.Reset()
			delete(workerAggs, id)
			delete(workerLastSeen, id)
		}
		for id, pa := range personaAggs {
			pa.Reset()
			delete(personaAggs, id)
		}
		tracerStats.Executed = 0
		tracerStats.Passed = 0
		tracerStats.Failed = 0
		*recentRequests = make([]Metric, 0)
		workerMu.Unlock()
		
		finalPayload := struct {
			TPS            float64                               `json:"tps"`
			P50            float64                               `json:"p50"`
			P90            float64                               `json:"p90"`
			P99            float64                               `json:"p99"`
			FailureRate    float64                               `json:"failure_rate"`
			Total          int                                   `json:"total"`
			QueueDepth     int64                                 `json:"queue_depth"`
			Global         aggregator.MetricsSnapshot            `json:"global"`
			Workers        map[string]aggregator.MetricsSnapshot `json:"workers"`
			Personas       map[string]aggregator.MetricsSnapshot `json:"personas"`
			TracerStats    TracerStats                           `json:"tracer_stats"`
			RecentRequests []Metric                              `json:"recent_requests"`
		}{
			TPS: 0, P50: 0, P90: 0, P99: 0, FailureRate: 0, Total: 0, QueueDepth: 0,
			Global:         aggregator.MetricsSnapshot{},
			Workers:        make(map[string]aggregator.MetricsSnapshot),
			Personas:       make(map[string]aggregator.MetricsSnapshot),
			TracerStats:    TracerStats{},
			RecentRequests: make([]Metric, 0),
		}
		data, _ := json.Marshal(finalPayload)
		hub.Broadcast("GLOBAL", data)

	case <-ticker.C:
		if paused {
			// Check if new metrics have arrived indicating a new benchmark
			globalSnap := agg.Snapshot()
			if globalSnap.Total == 0 {
				continue
			}
			paused = false // Resume broadcasting
		}

		// global snapshot
		globalSnap := agg.Snapshot()

		// build per-worker and per-persona snapshots
		workerMu.Lock()
		workers := make(map[string]aggregator.MetricsSnapshot)
		for id, wa := range workerAggs {
			workers[id] = wa.Snapshot()
		}
		personas := make(map[string]aggregator.MetricsSnapshot)
		for id, pa := range personaAggs {
			personas[id] = pa.Snapshot()
		}
		tStats := *tracerStats
		
		// Take a copy of recent requests and clear the buffer for the next second
		currentRecent := make([]Metric, len(*recentRequests))
		copy(currentRecent, *recentRequests)
		*recentRequests = make([]Metric, 0)
		workerMu.Unlock()

		var queueDepth int64 = 0
		groups, err := rdb.XInfoGroups(ctx, StreamName).Result()
		if err == nil {
			for _, g := range groups {
				if g.Name == GroupName {
					queueDepth = g.Lag
					if queueDepth == 0 && g.Pending > 0 {
						queueDepth = g.Pending
					}
					break
				}
			}
		}

		payload := struct {
			TPS            float64                                  `json:"tps"`
			P50            float64                                  `json:"p50"`
			P90            float64                                  `json:"p90"`
			P99            float64                                  `json:"p99"`
			FailureRate    float64                                  `json:"failure_rate"`
			Total          int                                      `json:"total"`
			QueueDepth     int64                                    `json:"queue_depth"`
			Global         aggregator.MetricsSnapshot               `json:"global"`
			Workers        map[string]aggregator.MetricsSnapshot    `json:"workers"`
			Personas       map[string]aggregator.MetricsSnapshot    `json:"personas"`
			TracerStats    TracerStats                              `json:"tracer_stats"`
			RecentRequests []Metric                                 `json:"recent_requests"`
		}{
			TPS:            globalSnap.TPS,
			P50:            globalSnap.P50,
			P90:            globalSnap.P90,
			P99:            globalSnap.P99,
			FailureRate:    globalSnap.FailureRate,
			Total:          globalSnap.Total,
			QueueDepth:     queueDepth,
			Global:         globalSnap,
			Workers:        workers,
			Personas:       personas,
			TracerStats:    tStats,
			RecentRequests: currentRecent,
		}

		data, _ := json.Marshal(payload)

		bID := "GLOBAL"
		if len(currentRecent) > 0 {
			bID = currentRecent[len(currentRecent)-1].BenchmarkID
		}
		hub.Broadcast(bID, data)
	}
}
}