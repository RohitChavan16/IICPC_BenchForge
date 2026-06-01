package server

import (
	"database/sql"

	"github.com/gorilla/mux"

	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/handlers"
)

func NewServer(db *sql.DB) *mux.Router {
	r := mux.NewRouter()
	benchmarkHandler := handlers.NewBenchmarkHandler(db)

	// List benchmarks
	r.HandleFunc("/benchmarks", benchmarkHandler.ListBenchmarks).Methods("GET")

	// Create benchmark
	r.HandleFunc("/benchmarks", benchmarkHandler.CreateBenchmark).Methods("POST")

	// Get benchmark by id
	r.HandleFunc("/benchmarks/{id}", benchmarkHandler.GetBenchmarkByID).Methods("GET")

	// Update benchmark status
	r.HandleFunc("/benchmarks/{id}/status", benchmarkHandler.UpdateBenchmarkStatus).Methods("PATCH")

	// Stop benchmark
	r.HandleFunc("/benchmarks/{id}/stop", benchmarkHandler.StopBenchmark).Methods("POST")

	return r
}
