package consumer

import (
	"context"
	"encoding/json"
	"log"
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
}

func StartConsumer(
	ctx context.Context,
	rdb *redis.Client,
	db *pgxpool.Pool,
	agg *aggregator.Aggregator,
	hub *ws.Hub,
) {

	consumerID := uuid.NewString()

	go startBroadcaster(ctx, agg, hub)

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
    
	agg.AddMetric(
		float64(metric.Latency),
		metric.Success,
	)
    err = database.InsertMetric(
	db,
	database.Metric{
		RequestID: metric.RequestID,
		BotType:   metric.BotType,
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
) {

	ticker := time.NewTicker(1 * time.Second)

	for {

	select {

	case <-ctx.Done():

		logger.Log.Info("Stopping broadcaster")

		ticker.Stop()

		return

	case <-ticker.C:

		snapshot := agg.Snapshot()

		data, _ := json.Marshal(snapshot)

		hub.Broadcast(data)
	}
}
}