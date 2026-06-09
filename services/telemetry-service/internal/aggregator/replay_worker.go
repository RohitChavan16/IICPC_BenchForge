package aggregator

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/database"
)

type BenchmarkServiceResponse struct {
	ID            string `json:"id"`
	Status        string `json:"status"`
	TotalRequests int    `json:"totalRequests"`
	FailureReason string `json:"failureReason"`
	StartedAt     string `json:"startedAt"`
	FinishedAt    string `json:"finishedAt"`
	CreatedAt     string `json:"createdAt"`
}

func GenerateReplay(db *pgxpool.Pool, benchmarkID string, defaultFailReason *string) {
	log.Printf("Starting replay generation for %s", benchmarkID)

	err := database.InsertReplayStatus(db, benchmarkID, "PROCESSING")
	if err != nil {
		log.Printf("Failed to set PROCESSING status: %v", err)
		return
	}

	// 1. Fetch benchmark metadata from Benchmark Service
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get(fmt.Sprintf("http://benchmark-service:8082/benchmarks/%s", benchmarkID))
	
	if err != nil || resp.StatusCode != http.StatusOK {
		status := 0
		if resp != nil {
			status = resp.StatusCode
		}
		log.Printf("Dependency benchmark-service unavailable: err=%v, status=%v", err, status)
		database.UpdateReplayData(db, benchmarkID, "PENDING_RETRY", nil)
		return
	}
	defer resp.Body.Close()

	var bmData BenchmarkServiceResponse
	if err := json.NewDecoder(resp.Body).Decode(&bmData); err != nil {
		log.Printf("Failed to decode benchmark response: %v", err)
		database.UpdateReplayData(db, benchmarkID, "PENDING_RETRY", nil)
		return
	}

	totalExpectedRequests := bmData.TotalRequests
	if totalExpectedRequests == 0 {
		totalExpectedRequests = 1 // Prevent division by zero
	}

	// 2. Fetch bucketed metrics using actual progress
	query := `
	WITH cumulative AS (
		SELECT 
			latency, success, bot_type, created_at,
			COUNT(*) OVER (ORDER BY created_at) as cumulative_requests
		FROM telemetry_metrics
		WHERE benchmark_id = $1
	),
	bucketed AS (
		SELECT 
			latency, success, bot_type,
			FLOOR(((cumulative_requests - 1) * 20.0) / $2::float) + 1 as bucket
		FROM cumulative
	)
	SELECT 
		bucket,
		COUNT(*) as requests_processed,
		SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
		PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency) as p50,
		PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY latency) as p90,
		PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency) as p99
	FROM bucketed
	GROUP BY bucket
	ORDER BY bucket;
	`

	rows, err := db.Query(context.Background(), query, benchmarkID, totalExpectedRequests)
	if err != nil {
		log.Printf("Failed to aggregate metrics: %v", err)
		database.UpdateReplayData(db, benchmarkID, "FAILED", nil)
		return
	}
	defer rows.Close()

	var snapshots []ReplaySnapshot
	totalProcessed := 0

	for rows.Next() {
		var bucket float64
		var count int
		var successCount int
		var p50, p90, p99 float64

		err := rows.Scan(&bucket, &count, &successCount, &p50, &p90, &p99)
		if err != nil {
			log.Printf("Failed to scan row: %v", err)
			continue
		}

		bIdx := int(bucket)

		totalProcessed += count
		successRate := 0
		if count > 0 {
			successRate = (successCount * 100) / count
		}

		tps := count * 2 // simplified TPS derivation

		// Fill missing buckets if any (for smooth timeline)
		for len(snapshots) < bIdx-1 {
			snapshots = append(snapshots, ReplaySnapshot{
				ProgressPercent:     (len(snapshots) + 1) * 5,
				TPS:                 0,
				P50:                 0,
				P90:                 0,
				P99:                 0,
				SuccessRate:         0,
				RequestsProcessed:   totalProcessed - count,
				RequestsRemaining:   totalExpectedRequests - (totalProcessed - count),
				PersonaDistribution: map[string]int{},
				PersonaMetrics:      map[string]PersonaMetrics{},
			})
		}

		snapshots = append(snapshots, ReplaySnapshot{
			ProgressPercent:     bIdx * 5,
			TPS:                 tps,
			P50:                 int64(p50),
			P90:                 int64(p90),
			P99:                 int64(p99),
			SuccessRate:         successRate,
			RequestsProcessed:   totalProcessed,
			RequestsRemaining:   totalExpectedRequests - totalProcessed,
			PersonaDistribution: map[string]int{},
			PersonaMetrics:      map[string]PersonaMetrics{},
		})
	}

	if len(snapshots) == 0 {
		// No telemetry found yet, maybe it failed instantly.
		database.UpdateReplayData(db, benchmarkID, "FAILED", nil)
		return
	}

	// 3. Persona specific aggregation
	personaQuery := `
	WITH cumulative AS (
		SELECT 
			latency, bot_type, created_at,
			COUNT(*) OVER (ORDER BY created_at) as cumulative_requests
		FROM telemetry_metrics
		WHERE benchmark_id = $1
	),
	bucketed AS (
		SELECT 
			latency, bot_type,
			FLOOR(((cumulative_requests - 1) * 20.0) / $2::float) + 1 as bucket
		FROM cumulative
	)
	SELECT 
		bucket,
		bot_type,
		COUNT(*) as count,
		PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency) as p99
	FROM bucketed
	GROUP BY bucket, bot_type
	`
	personaRows, err := db.Query(context.Background(), personaQuery, benchmarkID, totalExpectedRequests)
	if err == nil {
		defer personaRows.Close()
		for personaRows.Next() {
			var bucket float64
			var botType string
			var count int
			var p99 float64
			personaRows.Scan(&bucket, &botType, &count, &p99)
			
			bIdx := int(bucket)
			if bIdx >= 1 && bIdx <= len(snapshots) {
				idx := bIdx - 1
				snapshots[idx].PersonaDistribution[botType] = count
				snapshots[idx].PersonaMetrics[botType] = PersonaMetrics{
					TPS: count * 2,
					P99: int64(p99),
				}
			}
		}
	}

	// 4. Generate Insights
	insights := []ReplayInsight{}
	for i := 1; i < len(snapshots); i++ {
		prev := snapshots[i-1]
		curr := snapshots[i]
		
		if curr.P99 > int64(float64(prev.P99)*1.5) {
			insights = append(insights, ReplayInsight{
				BucketIndex: i,
				Type:        "LATENCY_ANOMALY",
				Message:     "P99 degraded by >50% compared to baseline.",
			})
		}
		
		if prev.P99 > 0 && curr.P99 < int64(float64(prev.P99)*0.5) {
			insights = append(insights, ReplayInsight{
				BucketIndex: i,
				Type:        "RECOVERY",
				Message:     "Latency stabilized to baseline.",
			})
		}

		totalVolume := curr.RequestsProcessed - prev.RequestsProcessed
		if totalVolume > 0 {
			for botType, count := range curr.PersonaDistribution {
				if float64(count)/float64(totalVolume) > 0.3 && botType == "whale" {
					insights = append(insights, ReplayInsight{
						BucketIndex: i,
						Type:        "PERSONA_SURGE",
						Message:     "Whale traffic exceeded 30% of total volume.",
					})
				}
			}
		}
	}

	// 5. Handle Failure Behavior
	status := "READY"
	failReason := defaultFailReason
	if bmData.Status == "FAILED" || bmData.Status == "ABORTED" {
		failReason = &bmData.FailureReason
		if *failReason == "" {
			fr := "Benchmark failed prematurely"
			failReason = &fr
		}
	}

	if failReason != nil {
		status = "FAILED"
		insights = append(insights, ReplayInsight{
			BucketIndex: len(snapshots) - 1,
			Type:        "FATAL_ERROR",
			Message:     "Benchmark terminated prematurely: " + *failReason,
		})
	}

	// 6. Build Lifecycle Events from benchmark metadata
	events := []LifecycleEvent{}
	if bmData.CreatedAt != "" {
		events = append(events, LifecycleEvent{Phase: "UPLOAD", Timestamp: bmData.CreatedAt, Status: "SUCCESS"})
	}
	if bmData.StartedAt != "" {
		// Rough estimate for build/deploy since we don't have exact from benchmark metadata
		events = append(events, LifecycleEvent{Phase: "BUILD", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
		events = append(events, LifecycleEvent{Phase: "DEPLOY", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
		events = append(events, LifecycleEvent{Phase: "VALIDATION", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
		events = append(events, LifecycleEvent{Phase: "BENCHMARK", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
	}

	replayData := ReplayData{
		BenchmarkID:    benchmarkID,
		Status:         status,
		FailureReason:  failReason,
		LifecycleEvents: events,
		Snapshots:      snapshots,
		Insights:       insights,
	}

	jsonData, err := json.Marshal(replayData)
	if err != nil {
		log.Printf("Failed to marshal JSON: %v", err)
		database.UpdateReplayData(db, benchmarkID, "FAILED", nil)
		return
	}

	database.UpdateReplayData(db, benchmarkID, status, jsonData)
	log.Printf("Successfully generated replay for %s with %d buckets", benchmarkID, len(snapshots))
}
