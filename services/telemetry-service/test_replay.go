package main

import (
	"encoding/json"
	"fmt"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/aggregator"
)

func main() {
	// mock output
	snapshots := []aggregator.ReplaySnapshot{}
	for i := 1; i <= 20; i++ {
		snapshots = append(snapshots, aggregator.ReplaySnapshot{
			ProgressPercent:   i * 5,
			TPS:               12000 + (i * 100),
			P50:               2,
			P90:               5,
			P99:               10 + int64(i),
			SuccessRate:       99,
			RequestsProcessed: i * 50000,
			RequestsRemaining: 1000000 - (i * 50000),
			PersonaDistribution: map[string]int{
				"retail_trader": 25000,
				"whale":         10000,
			},
			PersonaMetrics: map[string]aggregator.PersonaMetrics{},
		})
	}
	
	insights := []aggregator.ReplayInsight{
		{BucketIndex: 8, Type: "LATENCY_ANOMALY", Message: "P99 degraded by >50% compared to baseline."},
		{BucketIndex: 9, Type: "PERSONA_SURGE", Message: "Whale traffic exceeded 30% of total volume."},
	}

	data := aggregator.ReplayData{
		BenchmarkID: "bench-1234-abcd",
		Status:      "READY",
		LifecycleEvents: []aggregator.LifecycleEvent{
			{Phase: "UPLOAD", Timestamp: "2026-06-08T08:00:00Z", Status: "SUCCESS"},
			{Phase: "BUILD", Timestamp: "2026-06-08T08:01:00Z", Status: "SUCCESS"},
			{Phase: "DEPLOY", Timestamp: "2026-06-08T08:02:00Z", Status: "SUCCESS"},
			{Phase: "BENCHMARK", Timestamp: "2026-06-08T08:03:00Z", Status: "SUCCESS"},
		},
		Snapshots: snapshots,
		Insights:  insights,
	}

	b, _ := json.MarshalIndent(data, "", "  ")
	fmt.Println(string(b))
}
