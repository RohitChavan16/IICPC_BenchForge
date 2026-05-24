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
	ws "github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/websocket"
)

type Metric struct {
	RequestID string `json:"request_id"`
	BotType   string `json:"bot_type"`
	Latency   int64  `json:"latency"`
	Success   bool   `json:"success"`
}

func StartConsumer(
	rdb *redis.Client,
	db *pgxpool.Pool,
	agg *aggregator.Aggregator,
	hub *ws.Hub,
) {

	consumerID := uuid.NewString()

	go startBroadcaster(agg, hub)

	for {

		streams, err := rdb.XReadGroup(
			context.Background(),
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
	log.Println("DB insert failed:", err)
}
	err = rdb.XAck(
		context.Background(),
		StreamName,
		GroupName,
		message.ID,
	).Err()

	if err != nil {
		log.Println("ACK failed:", err)
	}
}

func startBroadcaster(
	agg *aggregator.Aggregator,
	hub *ws.Hub,
) {

	ticker := time.NewTicker(1 * time.Second)

	for range ticker.C {

		snapshot := agg.Snapshot()

		data, _ := json.Marshal(snapshot)

		hub.Broadcast(data)
	}
}