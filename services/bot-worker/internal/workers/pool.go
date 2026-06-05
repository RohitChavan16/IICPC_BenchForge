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
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/scenario"
	"encoding/json"
	"math/rand"
)

func Worker(
	ctx context.Context,
	id int,
	jobs <-chan int,
	results chan<- metrics.RequestMetric,
	exchangeURL string,
	rdb *redis.Client,
	benchmarkID string,
	submissionID string,
) {
	for {
		select {
		case <-ctx.Done():
			return
		case _, ok := <-jobs:
			if !ok {
				return
			}
			
			// 5% chance to run a Tracer Scenario
			isTracer := rand.Float32() < 0.05
			var metric metrics.RequestMetric
			
			if isTracer {
				start := time.Now()
				tracerSymbol := fmt.Sprintf("TRC-%s", uuid.NewString()[:8])
				s := generateTracerScenario(tracerSymbol)
				res := scenario.RunScenario(ctx, exchangeURL, s)
				latency := time.Since(start)

				if res.Status == "FAILED" && submissionID != "" {
					// Publish detailed tracer log
					msg := map[string]interface{}{
						"timestamp":    time.Now().UTC().Format(time.RFC3339),
						"stage":        "BENCHMARK",
						"type":         "log",
						"message":      fmt.Sprintf("[TRACER FAILED] %s: %s", s.Name, res.ErrorMessage),
						"stage_status": "IN_PROGRESS",
					}
					data, _ := json.Marshal(msg)
					rdb.Publish(context.Background(), "pipeline_logs:"+submissionID, data)
				}

				metric = metrics.RequestMetric{
					RequestID:   uuid.NewString(),
					BotType:     "tracer",
					WorkerID:    fmt.Sprintf("worker-%02d", id),
					BenchmarkID: benchmarkID,
					Latency:     latency,
					Success:     res.Status == "PASSED",
					Timestamp:   time.Now(),
					StatusCode:  200,
				}
			} else {
				order := bots.RetailTrader()
				start := time.Now()
				resp, err := bots.SendOrder(ctx, exchangeURL, order)
				latency := time.Since(start)

				metric = metrics.RequestMetric{
					RequestID:   uuid.NewString(),
					BotType:     "retail",
					WorkerID:    fmt.Sprintf("worker-%02d", id),
					BenchmarkID: benchmarkID,
					Latency:     latency,
					Success:     err == nil && checkCorrectnessStub(resp),
					Timestamp:   time.Now(),
				}

				if err == nil {
					metric.StatusCode = resp.StatusCode
				}
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

func generateTracerScenario(symbol string) scenario.Scenario {
	return scenario.Scenario{
		Name: "Tracer_Concurrency_Match",
		Steps: []scenario.OrderStep{
			{
				Order: bots.Order{Symbol: symbol, Price: 100.0, Quantity: 10, Side: "buy"},
				ExpectedStatus: "resting",
				ExpectedTrades: []scenario.ExpectedTrade{},
			},
			{
				Order: bots.Order{Symbol: symbol, Price: 100.0, Quantity: 10, Side: "sell"},
				ExpectedStatus: "filled",
				ExpectedTrades: []scenario.ExpectedTrade{
					{Price: 100.0, Quantity: 10},
				},
			},
		},
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