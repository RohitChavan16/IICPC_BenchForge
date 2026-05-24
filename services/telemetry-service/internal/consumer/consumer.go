package consumer

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

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
	agg *aggregator.Aggregator,
) {

	consumerID := uuid.NewString()

	go startBroadcaster(agg)

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
					agg,
					message,
				)
			}
		}
	}
}

func processMessage(
	rdb *redis.Client,
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
) {

	ticker := time.NewTicker(1 * time.Second)

	for range ticker.C {

		snapshot := agg.Snapshot()

		data, _ := json.Marshal(snapshot)

		ws.Broadcast(data)
	}
}