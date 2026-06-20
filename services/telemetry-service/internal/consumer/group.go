package consumer

import (
	"context"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	StreamName = "telemetry_stream"
	GroupName  = "telemetry_group"
)

func CreateConsumerGroup(rdb *redis.Client) {
	backoff := 1 * time.Second
	maxBackoff := 30 * time.Second

	for {
		err := rdb.XGroupCreateMkStream(
			context.Background(),
			StreamName,
			GroupName,
			"0",
		).Err()

		if err == nil {
			log.Println("Consumer group ready")
			return
		}

		if err.Error() == "BUSYGROUP Consumer Group name already exists" {
			log.Println("Consumer group already exists")
			return
		}

		log.Printf("Failed to create consumer group: %v. Retrying in %v...", err, backoff)
		time.Sleep(backoff)

		backoff *= 2
		if backoff > maxBackoff {
			backoff = maxBackoff
		}
	}
}