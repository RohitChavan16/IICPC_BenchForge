package server

import (
	"database/sql"

	"github.com/gorilla/mux"
	"github.com/redis/go-redis/v9"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gorilla/mux/otelmux"

	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/handlers"
	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/middleware"
)

func NewServer(db *sql.DB, rdb *redis.Client) *mux.Router {
	r := mux.NewRouter()
	
	r.Use(otelmux.Middleware("benchmark-service"))
	r.Use(middleware.CorrelationID)
	r.Use(middleware.PrometheusMetrics)

	r.Handle("/metrics", promhttp.Handler()).Methods("GET")

	benchmarkHandler := handlers.NewBenchmarkHandler(db, rdb)

	// Resume any queued benchmarks that were interrupted by a restart
	go benchmarkHandler.ProcessQueue()

	// Start the watchdog to detect abandoned benchmarks
	benchmarkHandler.StartWatchdog()

	// List benchmarks
	r.HandleFunc("/benchmarks", benchmarkHandler.ListBenchmarks).Methods("GET")

	// Create benchmark
	r.HandleFunc("/benchmarks", benchmarkHandler.CreateBenchmark).Methods("POST")

	// Get benchmark by id
	r.HandleFunc("/benchmarks/{id}", benchmarkHandler.GetBenchmarkByID).Methods("GET")

	// Update benchmark status
	r.HandleFunc("/benchmarks/{id}/status", benchmarkHandler.UpdateBenchmarkStatus).Methods("PATCH")

	// Heartbeat benchmark
	r.HandleFunc("/benchmarks/{id}/heartbeat", benchmarkHandler.HeartbeatBenchmark).Methods("PATCH")

	// Stop benchmark
	r.HandleFunc("/benchmarks/{id}/stop", benchmarkHandler.StopBenchmark).Methods("POST")

	return r
}
