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

	go startBroadcaster(ctx, agg, hub, workerAggs, workerLastSeen, workerMu, stopBroadcasterCh)

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
		// Acknowledge and return
		rdb.XAck(ctx, StreamName, GroupName, message.ID)
		return
	}
    
	// global aggregator
	agg.AddMetric(
		float64(metric.Latency),
		metric.Success,
	)

	// per-worker aggregator and last seen
	if metric.WorkerID != "" {
		workerMu.Lock()
		wa, ok := workerAggs[metric.WorkerID]
		if !ok {
			wa = aggregator.NewAggregator()
			workerAggs[metric.WorkerID] = wa
		}
		workerLastSeen[metric.WorkerID] = time.Now()
		workerMu.Unlock()

		wa.AddMetric(float64(metric.Latency), metric.Success)
	}
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
		workerMu.Unlock()
		
		finalPayload := struct {
			TPS         float64                               `json:"tps"`
			P50         float64                               `json:"p50"`
			P90         float64                               `json:"p90"`
			P99         float64                               `json:"p99"`
			FailureRate float64                               `json:"failure_rate"`
			Total       int                                   `json:"total"`
			Global      aggregator.MetricsSnapshot            `json:"global"`
			Workers     map[string]aggregator.MetricsSnapshot `json:"workers"`
		}{
			TPS: 0, P50: 0, P90: 0, P99: 0, FailureRate: 0, Total: 0,
			Global:  aggregator.MetricsSnapshot{},
			Workers: make(map[string]aggregator.MetricsSnapshot),
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

		// build per-worker snapshots
		workerMu.Lock()
		workers := make(map[string]aggregator.MetricsSnapshot)
		for id, wa := range workerAggs {
			workers[id] = wa.Snapshot()
		}
		workerMu.Unlock()

		// keep backward compatibility by including top-level fields
		payload := struct {
			TPS    float64                                  `json:"tps"`
			P50    float64                                  `json:"p50"`
			P90    float64                                  `json:"p90"`
			P99    float64                                  `json:"p99"`
			FailureRate float64                             `json:"failure_rate"`
			Total  int                                      `json:"total"`
			Global  aggregator.MetricsSnapshot              `json:"global"`
			Workers map[string]aggregator.MetricsSnapshot   `json:"workers"`
		}{
			TPS:         globalSnap.TPS,
			P50:         globalSnap.P50,
			P90:         globalSnap.P90,
			P99:         globalSnap.P99,
			FailureRate: globalSnap.FailureRate,
			Total:       globalSnap.Total,
			Global:      globalSnap,
			Workers:     workers,
		}

		data, _ := json.Marshal(payload)

		hub.Broadcast(data)
	}
}
}