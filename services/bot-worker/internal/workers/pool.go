package workers

import (
	"context"
	"fmt"
	"net/http"
	"time"
	"sync/atomic"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/bots"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/metrics"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/scenario"
	"encoding/json"
	"math/rand"
)

var (
	GlobalPersonaMix []string
	GlobalPersonaIdx int64
)

func GenerateDeterministicPersonaMix(total int) {
	retailCount := int(float64(total) * 0.60)
	mmCount := int(float64(total) * 0.20)
	scalperCount := int(float64(total) * 0.10)
	whaleCount := int(float64(total) * 0.05)
	hftCount := int(float64(total) * 0.05)

	// Adjust any rounding errors to ensure exact total
	retailCount += total - (retailCount + mmCount + scalperCount + whaleCount + hftCount)

	mix := make([]string, 0, total)
	for i := 0; i < retailCount; i++ { mix = append(mix, "retail") }
	for i := 0; i < mmCount; i++ { mix = append(mix, "market_maker") }
	for i := 0; i < scalperCount; i++ { mix = append(mix, "scalper") }
	for i := 0; i < whaleCount; i++ { mix = append(mix, "whale") }
	for i := 0; i < hftCount; i++ { mix = append(mix, "hft_stressor") }

	// Shuffle
	rand.Shuffle(len(mix), func(i, j int) {
		mix[i], mix[j] = mix[j], mix[i]
	})

	GlobalPersonaMix = mix
	GlobalPersonaIdx = 0
}

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
				// Deterministic Persona Router
				var botType string
				if len(GlobalPersonaMix) > 0 {
					idx := atomic.AddInt64(&GlobalPersonaIdx, 1) - 1
					botType = GlobalPersonaMix[idx%int64(len(GlobalPersonaMix))]
				} else {
					botType = "retail"
				}

				var order bots.Order
				switch botType {
				case "market_maker":
					order = bots.MarketMaker()
				case "scalper":
					order = bots.Scalper()
				case "whale":
					order = bots.Whale()
				case "hft_stressor":
					order = bots.HFTStressor()
				default:
					order = bots.RetailTrader()
					botType = "retail" // ensure fallback is explicitly labeled
				}

				start := time.Now()
				resp, err := bots.SendOrder(ctx, exchangeURL, order)
				latency := time.Since(start)

				metric = metrics.RequestMetric{
					RequestID:   uuid.NewString(),
					BotType:     botType,
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