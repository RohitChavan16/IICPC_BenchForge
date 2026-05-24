package metrics

import (
	"context"
	"encoding/json"

	"github.com/redis/go-redis/v9"
)

func PublishMetric(
	ctx context.Context,
	rdb *redis.Client,
	metric RequestMetric,
) error {

	data, err := json.Marshal(metric)

	if err != nil {
		return err
	}

	return rdb.XAdd(ctx, &redis.XAddArgs{
		Stream: "telemetry_stream",
		Values: map[string]interface{}{
			"metric": string(data),
		},
	}).Err()
}