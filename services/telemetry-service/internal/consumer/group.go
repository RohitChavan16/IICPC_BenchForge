package consumer

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
)

const (
	StreamName = "telemetry_stream"
	GroupName  = "telemetry_group"
)

func CreateConsumerGroup(
	rdb *redis.Client,
) {

	err := rdb.XGroupCreateMkStream(
		context.Background(),
		StreamName,
		GroupName,
		"0",
	).Err()

	if err != nil &&
		err.Error() != "BUSYGROUP Consumer Group name already exists" {

		log.Fatal(err)
	}

	log.Println("Consumer group ready")
}