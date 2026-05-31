package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/benchmarkclient"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/metrics"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/workers"
	"github.com/redis/go-redis/v9"
)

func main() {

	totalJobs := 1000
	totalWorkers := 100

	rdb := redis.NewClient(&redis.Options{
		Addr: "redis:6379",
	})

	benchmarkServiceURL := os.Getenv("BENCHMARK_SERVICE_URL")
	if benchmarkServiceURL == "" {
		benchmarkServiceURL = "http://api-gateway:8080"
	}

	benchmarkClient := benchmarkclient.NewClient(benchmarkServiceURL, 5*time.Second)

	benchmarkName := fmt.Sprintf("benchmark-%s", time.Now().UTC().Format("20060102-150405"))
	metadata, _ := json.Marshal(map[string]string{
		"engine": "benchforge",
	})

	// optional: deployment id to bind this benchmark to a deployed container
	deploymentID := os.Getenv("DEPLOYMENT_ID")

	ctx := context.Background()
	benchmarkID := ""

	created, err := benchmarkClient.CreateBenchmark(ctx, benchmarkclient.CreateBenchmarkRequest{
		Name:         benchmarkName,
		DeploymentID: deploymentID,
		WorkerCount:  totalWorkers,
		Metadata:     metadata,
	})
	if err != nil {
		log.Printf("BenchmarkCreatedFailed name=%s error=%v", benchmarkName, err)
	} else {
		benchmarkID = created.ID
		log.Printf("BenchmarkCreated benchmarkID=%s name=%s workerCount=%d", benchmarkID, benchmarkName, totalWorkers)
	}

	jobs := make(chan int, totalJobs)
	results := make(chan metrics.RequestMetric, totalJobs)

	exchangeURL := "http://mock-exchange:9000"

	for w := 1; w <= totalWorkers; w++ {
		go workers.Worker(w, jobs, results, exchangeURL, rdb)
	}

	start := time.Now()

	for j := 1; j <= totalJobs; j++ {
		jobs <- j
	}

	close(jobs)

	var metricsList []metrics.RequestMetric
	success := 0

	for a := 1; a <= totalJobs; a++ {
		result := <-results
		metricsList = append(metricsList, result)

		if result.Success {
			success++
		}
	}

	duration := time.Since(start)
	tps := float64(totalJobs) / duration.Seconds()
	failureCount := int64(totalJobs - success)

	p50, p90, p99 := calculatePercentiles(metricsList)

	log.Printf("BenchmarkCompleted benchmarkID=%s totalRequests=%d successCount=%d failureCount=%d duration=%s tps=%.2f p50=%.2f p90=%.2f p99=%.2f", benchmarkID, totalJobs, success, failureCount, duration, tps, p50, p90, p99)

	if benchmarkID != "" {
		_, err := benchmarkClient.UpdateStatus(ctx, benchmarkID, benchmarkclient.UpdateStatusRequest{
			Status:        "Completed",
			TotalRequests: int64(totalJobs),
			SuccessCount:  int64(success),
			FailureCount:  failureCount,
			P50:           p50,
			P90:           p90,
			P99:           p99,
		})
		if err != nil {
			log.Printf("BenchmarkPersistedFailed benchmarkID=%s error=%v", benchmarkID, err)
		} else {
			log.Printf("BenchmarkPersisted benchmarkID=%s", benchmarkID)
		}
	} else {
		log.Printf("BenchmarkPersistedSkipped no benchmarkID available")
	}

	fmt.Println("================================")
	fmt.Println("Benchmark Complete")
	fmt.Println("================================")
	fmt.Println("Total Requests:", totalJobs)
	fmt.Println("Successful:", success)
	fmt.Println("Duration:", duration)
	fmt.Printf("TPS: %.2f\n", tps)
}
