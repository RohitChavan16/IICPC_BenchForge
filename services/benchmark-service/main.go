package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

// Benchmark model moved to model.go

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:password@postgres:5432/iicpc?sslmode=disable"
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("failed to open db: %v", err)
	}
	defer db.Close()

	r := mux.NewRouter()

	// List benchmarks
	r.HandleFunc("/benchmarks", func(w http.ResponseWriter, r *http.Request) {
		items, err := ListBenchmarks(db, 100)
		if err != nil {
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		resp := map[string]interface{}{"items": items}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}).Methods("GET")

	// Create benchmark
	r.HandleFunc("/benchmarks", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		var req CreateBenchmarkRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		if req.Name == "" {
			http.Error(w, "name is required", http.StatusBadRequest)
			return
		}
		if req.WorkerCount < 0 {
			http.Error(w, "workerCount must be >= 0", http.StatusBadRequest)
			return
		}
		b, err := CreateBenchmark(db, req.Name, req.WorkerCount, req.Metadata)
		if err != nil {
			log.Printf("create benchmark error: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Location", "/benchmarks/"+b.ID)
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(b)
	}).Methods("POST")

	// Get benchmark by id
	r.HandleFunc("/benchmarks/{id}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]
		b, err := GetBenchmarkByID(db, id)
		if err != nil {
			if err == sql.ErrNoRows {
				http.NotFound(w, r)
				return
			}
			log.Printf("get benchmark error: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(b)
	}).Methods("GET")

	// Update benchmark status
	r.HandleFunc("/benchmarks/{id}/status", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPatch {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		vars := mux.Vars(r)
		id := vars["id"]
		var req UpdateStatusRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		if req.Status == "" {
			http.Error(w, "status is required", http.StatusBadRequest)
			return
		}
		if req.TotalRequests < 0 || req.SuccessCount < 0 || req.FailureCount < 0 {
			http.Error(w, "counts must be >= 0", http.StatusBadRequest)
			return
		}
		b, err := UpdateBenchmarkStatus(db, id, req.Status, req.TotalRequests, req.SuccessCount, req.FailureCount, req.P50, req.P90, req.P99)
		if err != nil {
			if err == sql.ErrNoRows {
				http.NotFound(w, r)
				return
			}
			log.Printf("update status error: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(b)
	}).Methods("PATCH")

	srv := &http.Server{
		Addr:         ":8082",
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Println("Benchmark service listening :8082")
	log.Fatal(srv.ListenAndServe())
}
