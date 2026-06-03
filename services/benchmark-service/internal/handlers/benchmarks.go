package handlers

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/redis/go-redis/v9"

	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/dto"
	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/repository"
)

type BenchmarkHandler struct {
	db  *sql.DB
	rdb *redis.Client
}

func NewBenchmarkHandler(db *sql.DB, rdb *redis.Client) *BenchmarkHandler {
	return &BenchmarkHandler{db: db, rdb: rdb}
}

type LogMessage struct {
	Timestamp   string `json:"timestamp"`
	Stage       string `json:"stage"`
	Type        string `json:"type"`
	Message     string `json:"message"`
	StageStatus string `json:"stage_status"`
}

func (h *BenchmarkHandler) publishLog(subID, stage, msgType, message, status string) {
	if subID == "" {
		return
	}
	msg := LogMessage{
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
		Stage:       stage,
		Type:        msgType,
		Message:     message,
		StageStatus: status,
	}
	data, _ := json.Marshal(msg)
	h.rdb.Publish(context.Background(), "pipeline_logs:"+subID, data)

	if msgType == "log" && message != "" {
		_, err := h.db.Exec(`INSERT INTO submission_logs (submission_id, stage, message) VALUES ($1, $2, $3)`, subID, stage, message)
		if err != nil {
			log.Printf("Failed to insert log for %s: %v", subID, err)
		}
	}
}

func (h *BenchmarkHandler) setStage(subID, stage, status, reason string) {
	if subID == "" {
		return
	}
	query := `UPDATE submissions SET current_stage=$1, stage_status=$2, failure_reason=$3, updated_at=now()`
	if status == "FAILED" || status == "SUCCESS" {
		if status == "FAILED" {
			query += `, finished_at=now(), status='FAILED'`
		} else if status == "SUCCESS" && stage == "BENCHMARK" {
			query += `, finished_at=now(), status='COMPLETED'`
		}
	}
	query += ` WHERE id=$4`

	_, err := h.db.Exec(query, stage, status, reason, subID)
	if err != nil {
		log.Printf("failed to set stage for %s: %v", subID, err)
	}
	h.publishLog(subID, stage, "state_change", reason, status)
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

func (h *BenchmarkHandler) ProcessQueue() {
	count, err := repository.CountRunningBenchmarks(h.db)
	if err != nil {
		log.Printf("ProcessQueue error counting: %v", err)
		return
	}
	if count >= 1 {
		return // Max concurrent benchmarks reached
	}

	b, err := repository.DequeueNextBenchmark(h.db)
	if err != nil {
		if err != sql.ErrNoRows {
			log.Printf("ProcessQueue error fetching next: %v", err)
		}
		return
	}

	if b.SubmissionID != "" {
		h.publishLog(b.SubmissionID, "BENCHMARK", "log", fmt.Sprintf("Benchmark %s is now RUNNING", b.Name), "IN_PROGRESS")
	}

	targetURL := "http://mock-exchange:9000"
	if b.TargetType == "deployment" && b.DeploymentID != "" {
		var containerPort int
		err := h.db.QueryRow(`SELECT container_port FROM deployments WHERE id=$1`, b.DeploymentID).Scan(&containerPort)
		if err == nil {
			targetURL = fmt.Sprintf("http://deployment-%s:%d", b.DeploymentID, containerPort)
		}
	}

	workerReqBody, _ := json.Marshal(map[string]interface{}{
		"benchmarkId": b.ID,
		"targetUrl": targetURL,
		"workerCount": b.WorkerCount,
		"totalRequests": b.TotalJobs,
	})
	
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Post("http://bot-worker:8085/run", "application/json", bytes.NewBuffer(workerReqBody))
	if err != nil || resp.StatusCode >= 400 {
		log.Printf("failed to trigger bot-worker: %v", err)
		repository.UpdateBenchmarkStatus(h.db, b.ID, "FAILED", 0, 0, 0, 0, 0, 0, "Failed to start bot-worker")
		if b.SubmissionID != "" {
			h.publishLog(b.SubmissionID, "BENCHMARK", "log", "Failed to start bot-worker", "FAILED")
			h.setStage(b.SubmissionID, "BENCHMARK", "FAILED", "Failed to contact bot-worker service")
		}
		
		// Failed, so process queue again
		go h.ProcessQueue()
	}
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
	
	if req.TargetType == "deployment" {
		if req.SubmissionID == "" || req.DeploymentID == "" {
			http.Error(w, "submissionId and deploymentId are required for deployment target", http.StatusBadRequest)
			return
		}
	}

	if req.WorkerCount <= 0 { req.WorkerCount = 100 }
	if req.TotalRequests <= 0 { req.TotalRequests = 1000 }

	var submissionID = req.SubmissionID
	req.UserID = r.Header.Get("X-User-Id")
	req.TeamID = r.Header.Get("X-Team-Id")
	req.TeamName = r.Header.Get("X-Team-Name")

	b, err := repository.CreateBenchmark(h.db, req.Name, req.UserID, req.TeamID, req.TeamName, req.SubmissionID, req.DeploymentID, req.TargetType, req.WorkerCount, req.TotalRequests, req.Metadata)
	if err != nil {
		log.Printf("create benchmark error: %v", err)
		if submissionID != "" {
			h.publishLog(submissionID, "BENCHMARK", "log", fmt.Sprintf("Failed to create benchmark record: %v", err), "FAILED")
			h.setStage(submissionID, "BENCHMARK", "FAILED", "Database error creating benchmark")
		}
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	
	if submissionID != "" {
		h.setStage(submissionID, "BENCHMARK", "IN_PROGRESS", "")
		h.publishLog(submissionID, "BENCHMARK", "log", fmt.Sprintf("Benchmark queued. Queue position: #%d", b.QueuePosition), "IN_PROGRESS")
	}

	go h.ProcessQueue()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Location", "/benchmarks/"+b.ID)
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(b)
}

func (h *BenchmarkHandler) HeartbeatBenchmark(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	vars := mux.Vars(r)
	id := vars["id"]

	// Just update last_heartbeat
	_, err := h.db.Exec(`UPDATE benchmarks SET last_heartbeat = now() WHERE id = $1 AND status = 'RUNNING'`, id)
	if err != nil {
		log.Printf("heartbeat error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
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
	
	b, err := repository.UpdateBenchmarkStatus(h.db, id, req.Status, req.TotalRequests, req.SuccessCount, req.FailureCount, req.P50, req.P90, req.P99, req.FailureReason)
	if err != nil {
		if err == sql.ErrNoRows {
			http.NotFound(w, r)
			return
		}
		log.Printf("update status error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if b.SubmissionID != "" {
		if req.Status == "COMPLETED" {
			// Even if completed, success rate must be reasonable
			if req.TotalRequests > 0 && req.SuccessCount == 0 {
				h.publishLog(b.SubmissionID, "BENCHMARK", "log", "Benchmark completed but success rate was 0%", "FAILED")
				h.setStage(b.SubmissionID, "BENCHMARK", "FAILED", "Benchmark executed but all requests failed (0% success rate). Check the sample Go engine requirements.")
			} else {
				h.publishLog(b.SubmissionID, "BENCHMARK", "log", fmt.Sprintf("Benchmark completed successfully! %d successful requests.", req.SuccessCount), "SUCCESS")
				h.setStage(b.SubmissionID, "BENCHMARK", "SUCCESS", "")
			}
		} else if req.Status == "FAILED" || req.Status == "CANCELLED" {
			h.publishLog(b.SubmissionID, "BENCHMARK", "log", fmt.Sprintf("Benchmark %s", req.Status), "FAILED")
			h.setStage(b.SubmissionID, "BENCHMARK", "FAILED", fmt.Sprintf("Benchmark status: %s", req.Status))
		} else if req.Status == "RUNNING" {
			h.publishLog(b.SubmissionID, "BENCHMARK", "log", "Benchmark execution running...", "IN_PROGRESS")
		}
	}

	if req.Status == "COMPLETED" || req.Status == "FAILED" || req.Status == "CANCELLED" {
		go h.ProcessQueue()
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

	resp, err := http.Post("http://bot-worker:8085/stop", "application/json", nil)
	if err != nil || resp.StatusCode >= 400 {
		log.Printf("failed to stop bot-worker: %v", err)
		http.Error(w, "failed to stop benchmark worker", http.StatusInternalServerError)
		return
	}

	repository.UpdateBenchmarkStatus(h.db, id, "CANCELLED", b.TotalRequests, b.SuccessCount, b.FailureCount, b.P50, b.P90, b.P99, "Benchmark was manually cancelled.")
	if b.SubmissionID != "" {
		h.setStage(b.SubmissionID, "BENCHMARK", "FAILED", "Benchmark was manually cancelled.")
	}
	
	updated, _ := repository.GetBenchmarkByID(h.db, id)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}
