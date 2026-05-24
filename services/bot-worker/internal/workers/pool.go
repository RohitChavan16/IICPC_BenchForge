package workers

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/bots"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/metrics"
)

func Worker(
	id int,
	jobs <-chan int,
	results chan<- metrics.RequestMetric,
	exchangeURL string,
	rdb *redis.Client,
) {
	for range jobs {

		order := bots.RetailTrader()

		start := time.Now()

		resp, err := bots.SendOrder(exchangeURL, order)

		latency := time.Since(start)

		metric := metrics.RequestMetric{
			RequestID: uuid.NewString(),
			BotType:   "retail",
			Latency:   latency,
			Success:   err == nil,
			Timestamp: time.Now(),
		}

		if err == nil {
			metric.StatusCode = resp.StatusCode
		}

		metrics.PublishMetric(
			context.Background(),
			rdb,
			metric,
		)

		results <- metric
	}
}