package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/benchmarkclient"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/config"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/metrics"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/middleware"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/scenario"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/tracing"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/workers"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/bots"
	"github.com/redis/go-redis/v9"
)

type RunRequest struct {
	BenchmarkID   string `json:"benchmarkId"`
	TargetURL     string `json:"targetUrl"`
	WorkerCount   int    `json:"workerCount"`
	TotalRequests int    `json:"totalRequests"`
	SubmissionID  string `json:"submissionId"`
	Token         string `json:"token"`
	TraceID       string `json:"traceId"`
	TraceContext  map[string]string `json:"traceContext"`
	Seed          int64  `json:"seed,omitempty"`
}

var (
	rdb              *redis.Client
	benchmarkClient  *benchmarkclient.Client
	cfg              *config.Config
	activeMu         sync.Mutex
	activeCancel     context.CancelFunc
	activeBenchmarkID string
)

func main() {
	tp, err := tracing.InitTracer("bot-worker")
	if err == nil {
		defer tp.Shutdown(context.Background())
	}
	
	cfg = config.LoadConfig()

	rdb = redis.NewClient(&redis.Options{
		Addr: cfg.RedisURL,
	})

	benchmarkClient = benchmarkclient.NewClient(cfg.BenchmarkServiceURL, 5*time.Second)

	http.HandleFunc("/run", handleRun)
	http.HandleFunc("/run-scenario", handleRunScenario)
	http.HandleFunc("/stop", handleStop)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	srv := &http.Server{
		Addr:    ":8085",
		Handler: middleware.Recovery(http.DefaultServeMux),
	}

	go func() {
		log.Println("Bot worker listening on :8085")
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("failed to start bot-worker: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("Shutting down bot-worker gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	} else {
		log.Println("bot-worker stopped")
	}
}

func handleRun(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "method not allowed", "status": http.StatusMethodNotAllowed})
		return
	}
	var req RunRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "invalid request", "status": http.StatusBadRequest})
		return
	}
	if req.BenchmarkID == "" || req.TargetURL == "" || req.WorkerCount <= 0 || req.TotalRequests <= 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "invalid parameters", "status": http.StatusBadRequest})
		return
	}

	activeMu.Lock()
	if activeCancel != nil {
		activeMu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "a benchmark is already running", "status": http.StatusConflict})
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
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "method not allowed", "status": http.StatusMethodNotAllowed})
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

type ScenarioRequest struct {
	BenchmarkID string              `json:"benchmarkId"`
	TargetURL   string              `json:"targetUrl"`
	Scenarios   []scenario.Scenario `json:"scenarios"`
}

func handleRunScenario(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "method not allowed", "status": http.StatusMethodNotAllowed})
		return
	}
	var req ScenarioRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "invalid request", "status": http.StatusBadRequest})
		return
	}

	results := make([]scenario.ScenarioResult, 0, len(req.Scenarios))
	for _, s := range req.Scenarios {
		// Run sequentially
		res := scenario.RunScenario(r.Context(), nil, req.TargetURL, s)
		results = append(results, res)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}


func runBenchmark(ctx context.Context, req RunRequest) {
	defer func() {
		activeMu.Lock()
		if activeCancel != nil && activeBenchmarkID == req.BenchmarkID {
			activeCancel()
			activeCancel = nil
			activeBenchmarkID = ""
		}
		activeMu.Unlock()
	}()

	log.Printf("Starting benchmark pool for %s", req.BenchmarkID)
	
	workers.GenerateDeterministicPersonaMix(req.TotalRequests, req.Seed)

	jobs := make(chan int, req.TotalRequests)
	results := make(chan metrics.RequestMetric, req.TotalRequests)

	// Create scoped HTTP Client tuned for concurrency
	httpClient := bots.CreateHTTPClient(req.WorkerCount)

	var wg sync.WaitGroup
	for w := 1; w <= req.WorkerCount; w++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			workers.Worker(ctx, id, jobs, results, req.TargetURL, rdb, req.BenchmarkID, req.SubmissionID, req.Token, req.TraceID, req.TraceContext, req.Seed, httpClient)
		}(w)
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	// Warmup Period
	log.Printf("Starting 5-second warmup period for %s", req.BenchmarkID)
	var warmupWg sync.WaitGroup
	warmupCtx, cancelWarmup := context.WithTimeout(ctx, 5*time.Second)
	
	for w := 0; w < 10; w++ { // 10 concurrent warmup workers
		warmupWg.Add(1)
		go func(wID int) {
			defer warmupWg.Done()
			rng := rand.New(rand.NewSource(req.Seed + int64(wID) + 1000))
			for {
				select {
				case <-warmupCtx.Done():
					return
				default:
					order := bots.RetailTrader(rng)
					bots.SendOrder(warmupCtx, httpClient, req.TargetURL, order)
				}
			}
		}(w)
	}
	warmupWg.Wait()
	cancelWarmup()
	log.Printf("Warmup complete for %s", req.BenchmarkID)

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

	// Heartbeat goroutine
	go func() {
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()
		benchmarkURL := cfg.BenchmarkServiceURL + "/benchmarks/" + req.BenchmarkID + "/heartbeat"
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				client := &http.Client{Timeout: 5 * time.Second}
				req, err := http.NewRequest("PATCH", benchmarkURL, nil)
				if err == nil {
					resp, _ := client.Do(req)
					if resp != nil {
						resp.Body.Close()
					}
				}
			}
		}
	}()

	hist := NewLatencyHistogram(10000)
	success := 0
	failureCount := int64(0)
	tracerTotal := int64(0)
	tracerSuccess := int64(0)
	completedJobs := 0

	for result := range results {
		if !result.Success {
			hist.Add(5000.0) // Heavily penalize failed requests to avoid survivorship bias
		} else {
			hist.Add(result.Latency.Seconds() * 1000)
		}
		completedJobs++
		if result.BotType == "tracer" {
			tracerTotal++
			if result.Success {
				tracerSuccess++
			}
			// Let tracers still count towards global success/failure so TPS and overall success rate accurately reflect load failures.
		}

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
	
	p50 := hist.Percentile(50)
	p90 := hist.Percentile(90)
	p99 := hist.Percentile(99)

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
		TracerTotal:   tracerTotal,
		TracerSuccess: tracerSuccess,
	})

	if err != nil {
		log.Printf("BenchmarkPersistedFailed benchmarkID=%s error=%v", req.BenchmarkID, err)
	}

	metrics.PublishMetric(context.Background(), rdb, metrics.RequestMetric{
		BotType:     "system_control",
		WorkerID:    "STOP_STREAM",
		BenchmarkID: req.BenchmarkID,
		Token:       req.Token,
	})
}
