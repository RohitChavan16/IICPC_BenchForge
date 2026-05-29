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
	RequestID string `json:"request_id"`
	BotType   string `json:"bot_type"`
	Latency   int64  `json:"latency"`
	Success   bool   `json:"success"`
	WorkerID  string `json:"worker_id"`
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

	go startBroadcaster(ctx, agg, hub, workerAggs, workerLastSeen, workerMu)

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
		RequestID: metric.RequestID,
		BotType:   metric.BotType,
		WorkerID:  metric.WorkerID,
		Latency:   metric.Latency,
		Success:   metric.Success,
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
) {

	ticker := time.NewTicker(1 * time.Second)

	for {

	select {

	case <-ctx.Done():

		logger.Log.Info("Stopping broadcaster")

		ticker.Stop()

		return

	case <-ticker.C:

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