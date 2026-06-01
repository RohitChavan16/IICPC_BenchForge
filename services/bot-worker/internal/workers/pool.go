package workers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/bots"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/metrics"
)

func Worker(
	ctx context.Context,
	id int,
	jobs <-chan int,
	results chan<- metrics.RequestMetric,
	exchangeURL string,
	rdb *redis.Client,
) {
	for {
		select {
		case <-ctx.Done():
			return
		case _, ok := <-jobs:
			if !ok {
				return
			}
			order := bots.RetailTrader()
			start := time.Now()
			resp, err := bots.SendOrder(exchangeURL, order)
			latency := time.Since(start)

			metric := metrics.RequestMetric{
				RequestID: uuid.NewString(),
				BotType:   "retail",
				WorkerID:  fmt.Sprintf("worker-%02d", id),
				Latency:   latency,
				Success:   err == nil && checkCorrectnessStub(resp),
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
}

// checkCorrectnessStub is a placeholder for validating the exchange's response payload
// e.g., verifying that order fills, balances, or order books are mathematically sound.
func checkCorrectnessStub(resp *http.Response) bool {
	if resp == nil {
		return false
	}
	// For Phase 8 stub: Just assume 200 OK means correct for now.
	// True correctness engine will be implemented in future phases.
	return resp.StatusCode >= 200 && resp.StatusCode < 300
}