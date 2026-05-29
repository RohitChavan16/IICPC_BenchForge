package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/dto"
	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/repository"
)

type BenchmarkHandler struct {
	db *sql.DB
}

func NewBenchmarkHandler(db *sql.DB) *BenchmarkHandler {
	return &BenchmarkHandler{db: db}
}

func (h *BenchmarkHandler) ListBenchmarks(w http.ResponseWriter, r *http.Request) {
	items, err := repository.ListBenchmarks(h.db, 100)
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	resp := map[string]interface{}{"items": items}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *BenchmarkHandler) CreateBenchmark(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req dto.CreateBenchmarkRequest
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
	b, err := repository.CreateBenchmark(h.db, req.Name, req.WorkerCount, req.Metadata)
	if err != nil {
		log.Printf("create benchmark error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Location", "/benchmarks/"+b.ID)
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(b)
}

func (h *BenchmarkHandler) GetBenchmarkByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	b, err := repository.GetBenchmarkByID(h.db, id)
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
}

func (h *BenchmarkHandler) UpdateBenchmarkStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	vars := mux.Vars(r)
	id := vars["id"]
	var req dto.UpdateStatusRequest
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
	b, err := repository.UpdateBenchmarkStatus(h.db, id, req.Status, req.TotalRequests, req.SuccessCount, req.FailureCount, req.P50, req.P90, req.P99)
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
}
