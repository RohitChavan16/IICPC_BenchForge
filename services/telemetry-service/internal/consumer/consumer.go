package consumer

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/database"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/aggregator"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/logger"
	ws "github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/websocket"
)

type Metric struct {
	RequestID   string `json:"request_id"`
	BotType     string `json:"bot_type"`
	Latency     int64  `json:"latency"`
	Success     bool   `json:"success"`
	WorkerID    string `json:"worker_id"`
	BenchmarkID string `json:"benchmark_id"`
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

	consumerID := uuid.NewString()

	stopBroadcasterCh := make(chan struct{}, 1)

	// New tracking variables
	personaAggs := make(map[string]*aggregator.Aggregator)
	tracerStats := &TracerStats{}
	var recentRequests []Metric

	go startBroadcaster(ctx, agg, hub, workerAggs, workerLastSeen, workerMu, personaAggs, tracerStats, &recentRequests, stopBroadcasterCh)

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
				continue
			}

			log.Println(err)
			continue
		}

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
    
	// global aggregator
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

    err = database.InsertMetric(
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
	logger.Log.Error(
	"DB insert failed",
	"error",
	err,
)
}
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
			Global         aggregator.MetricsSnapshot            `json:"global"`
			Workers        map[string]aggregator.MetricsSnapshot `json:"workers"`
			Personas       map[string]aggregator.MetricsSnapshot `json:"personas"`
			TracerStats    TracerStats                           `json:"tracer_stats"`
			RecentRequests []Metric                              `json:"recent_requests"`
		}{
			TPS: 0, P50: 0, P90: 0, P99: 0, FailureRate: 0, Total: 0,
			Global:         aggregator.MetricsSnapshot{},
			Workers:        make(map[string]aggregator.MetricsSnapshot),
			Personas:       make(map[string]aggregator.MetricsSnapshot),
			TracerStats:    TracerStats{},
			RecentRequests: make([]Metric, 0),
		}
		data, _ := json.Marshal(finalPayload)
		hub.Broadcast(data)

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

		payload := struct {
			TPS            float64                                  `json:"tps"`
			P50            float64                                  `json:"p50"`
			P90            float64                                  `json:"p90"`
			P99            float64                                  `json:"p99"`
			FailureRate    float64                                  `json:"failure_rate"`
			Total          int                                      `json:"total"`
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
			Global:         globalSnap,
			Workers:        workers,
			Personas:       personas,
			TracerStats:    tStats,
			RecentRequests: currentRecent,
		}

		data, _ := json.Marshal(payload)

		hub.Broadcast(data)
	}
}
}