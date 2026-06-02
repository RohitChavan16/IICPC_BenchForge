package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/benchmarkclient"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/metrics"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/workers"
	"github.com/redis/go-redis/v9"
)

type RunRequest struct {
	BenchmarkID   string `json:"benchmarkId"`
	TargetURL     string `json:"targetUrl"`
	WorkerCount   int    `json:"workerCount"`
	TotalRequests int    `json:"totalRequests"`
}

var (
	rdb              *redis.Client
	benchmarkClient  *benchmarkclient.Client
	activeMu         sync.Mutex
	activeCancel     context.CancelFunc
	activeBenchmarkID string
)

func main() {
	rdb = redis.NewClient(&redis.Options{
		Addr: "redis:6379",
	})

	benchmarkServiceURL := os.Getenv("BENCHMARK_SERVICE_URL")
	if benchmarkServiceURL == "" {
		benchmarkServiceURL = "http://benchmark-service:8082"
	}
	benchmarkClient = benchmarkclient.NewClient(benchmarkServiceURL, 5*time.Second)

	http.HandleFunc("/run", handleRun)
	http.HandleFunc("/stop", handleStop)

	log.Println("Bot worker listening on :8085")
	if err := http.ListenAndServe(":8085", nil); err != nil {
		log.Fatalf("failed to start bot-worker: %v", err)
	}
}

func handleRun(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req RunRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if req.BenchmarkID == "" || req.TargetURL == "" || req.WorkerCount <= 0 || req.TotalRequests <= 0 {
		http.Error(w, "invalid parameters", http.StatusBadRequest)
		return
	}

	activeMu.Lock()
	if activeCancel != nil {
		activeMu.Unlock()
		http.Error(w, "a benchmark is already running", http.StatusConflict)
		return
	}
	
	ctx, cancel := context.WithCancel(context.Background())
	activeCancel = cancel
	activeBenchmarkID = req.BenchmarkID
	activeMu.Unlock()

	go runBenchmark(ctx, req)

	w.WriteHeader(http.StatusAccepted)
	fmt.Fprintf(w, `{"status":"started", "benchmarkId":"%s"}`, req.BenchmarkID)
}

func handleStop(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	activeMu.Lock()
	defer activeMu.Unlock()

	if activeCancel != nil {
		activeCancel()
		activeCancel = nil
		activeBenchmarkID = ""
		fmt.Fprintf(w, `{"status":"stopped"}`)
	} else {
		fmt.Fprintf(w, `{"status":"not_running"}`)
	}
}


func runBenchmark(ctx context.Context, req RunRequest) {
	log.Printf("Starting benchmark pool for %s", req.BenchmarkID)
	
	jobs := make(chan int, req.TotalRequests)
	results := make(chan metrics.RequestMetric, req.TotalRequests)

	var wg sync.WaitGroup
	for w := 1; w <= req.WorkerCount; w++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			workers.Worker(ctx, id, jobs, results, req.TargetURL, rdb, req.BenchmarkID)
		}(w)
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	start := time.Now()
	
	go func() {
		for j := 1; j <= req.TotalRequests; j++ {
			select {
			case <-ctx.Done():
				return
			case jobs <- j:
			}
		}
		close(jobs)
	}()

	var metricsList []metrics.RequestMetric
	success := 0
	failureCount := int64(0)
	completedJobs := 0

	for result := range results {
		metricsList = append(metricsList, result)
		completedJobs++
		if result.Success {
			success++
		} else {
			failureCount++
		}
	}

	duration := time.Since(start)
	tps := 0.0
	if duration.Seconds() > 0 {
		tps = float64(completedJobs) / duration.Seconds()
	}
	
	p50, p90, p99 := calculatePercentiles(metricsList)

	log.Printf("BenchmarkCompleted benchmarkID=%s completed=%d success=%d failure=%d duration=%s tps=%.2f p50=%.2f p90=%.2f p99=%.2f", 
		req.BenchmarkID, completedJobs, success, failureCount, duration, tps, p50, p90, p99)

	status := "COMPLETED"
	if ctx.Err() != nil {
		status = "CANCELLED"
	}

	_, err := benchmarkClient.UpdateStatus(context.Background(), req.BenchmarkID, benchmarkclient.UpdateStatusRequest{
		Status:        status,
		TotalRequests: int64(completedJobs),
		SuccessCount:  int64(success),
		FailureCount:  failureCount,
		P50:           p50,
		P90:           p90,
		P99:           p99,
	})

	if err != nil {
		log.Printf("BenchmarkPersistedFailed benchmarkID=%s error=%v", req.BenchmarkID, err)
	}

	metrics.PublishMetric(context.Background(), rdb, metrics.RequestMetric{
		BotType:   "system_control",
		WorkerID:  "STOP_STREAM",
	})

	activeMu.Lock()
	if activeBenchmarkID == req.BenchmarkID {
		activeCancel = nil
		activeBenchmarkID = ""
	}
	activeMu.Unlock()
}
