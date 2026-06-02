package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
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
	if req.TargetType != "mock" && req.TargetType != "deployment" {
		req.TargetType = "mock"
	}
	
	if req.WorkerCount <= 0 { req.WorkerCount = 100 }
	if req.TotalRequests <= 0 { req.TotalRequests = 1000 }

	var activeCount int
	if req.DeploymentID != "" {
		if err := h.db.QueryRow(`SELECT COUNT(*) FROM benchmarks WHERE deployment_id=$1 AND status IN ('CREATED', 'QUEUED', 'RUNNING')`, req.DeploymentID).Scan(&activeCount); err != nil {
			log.Printf("check active benchmarks error: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		if activeCount > 0 {
			http.Error(w, "a benchmark is already currently active for this deployment", http.StatusConflict)
			return
		}
	}

	targetURL := "http://mock-exchange:9000"
	
	if req.TargetType == "deployment" {
		if req.DeploymentID == "" {
			http.Error(w, "deploymentId is required for deployment target", http.StatusBadRequest)
			return
		}
		var containerPort int
		err := h.db.QueryRow(`SELECT container_port FROM deployments WHERE id=$1 AND deployment_status='RUNNING'`, req.DeploymentID).Scan(&containerPort)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "deployment not found or not running", http.StatusBadRequest)
			} else {
				log.Printf("validate deployment error: %v", err)
				http.Error(w, "internal server error", http.StatusInternalServerError)
			}
			return
		}
		targetURL = fmt.Sprintf("http://deployment-%s:%d", req.DeploymentID, containerPort)
	}

	req.UserID = r.Header.Get("X-User-Id")
	req.TeamID = r.Header.Get("X-Team-Id")
	req.TeamName = r.Header.Get("X-Team-Name")

	b, err := repository.CreateBenchmark(h.db, req.Name, req.UserID, req.TeamID, req.TeamName, req.SubmissionID, req.DeploymentID, req.TargetType, req.WorkerCount, req.TotalRequests, req.Metadata)
	if err != nil {
		log.Printf("create benchmark error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	
	// Trigger bot-worker
	workerReqBody, _ := json.Marshal(map[string]interface{}{
		"benchmarkId": b.ID,
		"targetUrl": targetURL,
		"workerCount": b.WorkerCount,
		"totalRequests": b.TotalJobs,
	})
	
	resp, err := http.Post("http://bot-worker:8085/run", "application/json", bytes.NewBuffer(workerReqBody))
	if err != nil || resp.StatusCode >= 400 {
		log.Printf("failed to trigger bot-worker: %v", err)
		repository.UpdateBenchmarkStatus(h.db, b.ID, "FAILED", 0, 0, 0, 0, 0, 0)
		http.Error(w, "failed to start benchmark worker", http.StatusInternalServerError)
		return
	}
	repository.UpdateBenchmarkStatus(h.db, b.ID, "RUNNING", 0, 0, 0, 0, 0, 0)

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
	validStatuses := map[string]bool{"CREATED": true, "QUEUED": true, "RUNNING": true, "COMPLETED": true, "FAILED": true, "CANCELLED": true}
	if !validStatuses[req.Status] {
		http.Error(w, "invalid status", http.StatusBadRequest)
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

	if req.Status == "COMPLETED" {
		if b.TargetType == "deployment" {
			if err := repository.UpsertLeaderboardEntryFromBenchmark(h.db, id); err != nil {
				log.Printf("leaderboard upsert error: %v", err)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(b)
}

func (h *BenchmarkHandler) StopBenchmark(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	vars := mux.Vars(r)
	id := vars["id"]

	b, err := repository.GetBenchmarkByID(h.db, id)
	if err != nil {
		if err == sql.ErrNoRows {
			http.NotFound(w, r)
			return
		}
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if b.Status != "RUNNING" {
		http.Error(w, "benchmark is not running", http.StatusBadRequest)
		return
	}

	// Trigger bot-worker stop
	resp, err := http.Post("http://bot-worker:8085/stop", "application/json", nil)
	if err != nil || resp.StatusCode >= 400 {
		log.Printf("failed to stop bot-worker: %v", err)
		http.Error(w, "failed to stop benchmark worker", http.StatusInternalServerError)
		return
	}

	repository.UpdateBenchmarkStatus(h.db, id, "CANCELLED", b.TotalRequests, b.SuccessCount, b.FailureCount, b.P50, b.P90, b.P99)
	updated, _ := repository.GetBenchmarkByID(h.db, id)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}
