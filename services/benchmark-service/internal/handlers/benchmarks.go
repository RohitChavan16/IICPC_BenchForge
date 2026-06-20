package handlers

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/redis/go-redis/v9"
	"github.com/golang-jwt/jwt/v5"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"

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
	userID := r.Header.Get("X-User-Id")
	items, err := repository.ListBenchmarks(h.db, 100, userID)
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
		h.publishLog(b.SubmissionID, "VALIDATING_CORRECTNESS", "log", fmt.Sprintf("Validating correctness for %s", b.Name), "IN_PROGRESS")
		h.setStage(b.SubmissionID, "VALIDATING_CORRECTNESS", "IN_PROGRESS", "")
	}

	targetURL := "http://mock-exchange:9000"
	if b.TargetType == "deployment" && b.DeploymentID != "" {
		var containerPort int
		err := h.db.QueryRow(`SELECT container_port FROM deployments WHERE id=$1`, b.DeploymentID).Scan(&containerPort)
		if err == nil {
			targetURL = fmt.Sprintf("http://deployment-%s:%d", b.DeploymentID, containerPort)
		}
	}

	// -- Run Correctness Validation First --
	scenarioReqBody, _ := json.Marshal(map[string]interface{}{
		"benchmarkId": b.ID,
		"targetUrl":   targetURL,
		"scenarios": []map[string]interface{}{
			{
				"name": "basic_resting_order",
				"steps": []map[string]interface{}{
					{
						"order":           map[string]interface{}{"symbol": "AAPL", "price": 150.0, "quantity": 100, "side": "buy"},
						"expected_status": "resting",
						"expected_trades": []interface{}{},
					},
				},
			},
			{
				"name": "basic_matching_order",
				"steps": []map[string]interface{}{
					{
						"order":           map[string]interface{}{"symbol": "MSFT", "price": 200.0, "quantity": 50, "side": "buy"},
						"expected_status": "resting",
						"expected_trades": []interface{}{},
					},
					{
						"order":           map[string]interface{}{"symbol": "MSFT", "price": 200.0, "quantity": 50, "side": "sell"},
						"expected_status": "filled",
						"expected_trades": []map[string]interface{}{
							{"price": 200.0, "quantity": 50},
						},
					},
				},
			},
			{
				"name": "partial_fill_order",
				"steps": []map[string]interface{}{
					{
						"order":           map[string]interface{}{"symbol": "AMZN", "price": 100.0, "quantity": 100, "side": "buy"},
						"expected_status": "resting",
						"expected_trades": []interface{}{},
					},
					{
						"order":           map[string]interface{}{"symbol": "AMZN", "price": 100.0, "quantity": 50, "side": "sell"},
						"expected_status": "filled",
						"expected_trades": []map[string]interface{}{
							{"maker_order_ref": 0, "price": 100.0, "quantity": 50},
						},
					},
					{
						"order":           map[string]interface{}{"symbol": "AMZN", "price": 100.0, "quantity": 50, "side": "sell"},
						"expected_status": "filled",
						"expected_trades": []map[string]interface{}{
							{"maker_order_ref": 0, "price": 100.0, "quantity": 50},
						},
					},
				},
			},
			{
				"name": "price_improvement",
				"steps": []map[string]interface{}{
					{
						"order":           map[string]interface{}{"symbol": "TSLA", "price": 100.0, "quantity": 10, "side": "buy"},
						"expected_status": "resting",
						"expected_trades": []interface{}{},
					},
					{
						"order":           map[string]interface{}{"symbol": "TSLA", "price": 90.0, "quantity": 10, "side": "sell"},
						"expected_status": "filled",
						"expected_trades": []map[string]interface{}{
							{"maker_order_ref": 0, "price": 100.0, "quantity": 10},
						},
					},
				},
			},
			{
				"name": "fifo_priority",
				"steps": []map[string]interface{}{
					{
						"order":           map[string]interface{}{"symbol": "GOOG", "price": 100.0, "quantity": 10, "side": "buy"},
						"expected_status": "resting",
						"expected_trades": []interface{}{},
					},
					{
						"order":           map[string]interface{}{"symbol": "GOOG", "price": 100.0, "quantity": 20, "side": "buy"},
						"expected_status": "resting",
						"expected_trades": []interface{}{},
					},
					{
						"order":           map[string]interface{}{"symbol": "GOOG", "price": 100.0, "quantity": 15, "side": "sell"},
						"expected_status": "filled",
						"expected_trades": []map[string]interface{}{
							{"maker_order_ref": 0, "price": 100.0, "quantity": 10},
							{"maker_order_ref": 1, "price": 100.0, "quantity": 5},
						},
					},
				},
			},
			{
				"name": "multi_level_price_sweep",
				"steps": []map[string]interface{}{
					{
						"order":           map[string]interface{}{"symbol": "NVDA", "price": 100.0, "quantity": 10, "side": "sell"},
						"expected_status": "resting",
						"expected_trades": []interface{}{},
					},
					{
						"order":           map[string]interface{}{"symbol": "NVDA", "price": 101.0, "quantity": 10, "side": "sell"},
						"expected_status": "resting",
						"expected_trades": []interface{}{},
					},
					{
						"order":           map[string]interface{}{"symbol": "NVDA", "price": 102.0, "quantity": 10, "side": "sell"},
						"expected_status": "resting",
						"expected_trades": []interface{}{},
					},
					{
						"order":           map[string]interface{}{"symbol": "NVDA", "price": 105.0, "quantity": 25, "side": "buy"},
						"expected_status": "filled",
						"expected_trades": []map[string]interface{}{
							{"maker_order_ref": 0, "price": 100.0, "quantity": 10},
							{"maker_order_ref": 1, "price": 101.0, "quantity": 10},
							{"maker_order_ref": 2, "price": 102.0, "quantity": 5},
						},
					},
				},
			},
		},
	})

	client := &http.Client{Timeout: 30 * time.Second}
	scenarioResp, err := client.Post("http://bot-worker:8085/run-scenario", "application/json", bytes.NewBuffer(scenarioReqBody))
	if err == nil && scenarioResp.StatusCode == http.StatusOK {
		var results []map[string]interface{}
		json.NewDecoder(scenarioResp.Body).Decode(&results)
		scenarioResp.Body.Close()

		unknown := false
		
		scenarioWeights := map[string]float64{
			"basic_resting_order":     15.0,
			"basic_matching_order":    15.0,
			"partial_fill_order":      15.0,
			"price_improvement":       20.0,
			"fifo_priority":           20.0,
			"multi_level_price_sweep": 15.0,
		}

		var correctnessScore float64 = 0.0
		var maxPossibleScore float64 = 0.0

		for _, r := range results {
			if r["status"] == "CONTRACT_NOT_SUPPORTED" {
				unknown = true
			}
			
			name, ok := r["name"].(string)
			if !ok {
				continue
			}
			status, _ := r["status"].(string)
			
			weight, exists := scenarioWeights[name]
			if !exists {
				continue
			}
			
			maxPossibleScore += weight
			if status == "PASSED" {
				correctnessScore += weight
			}
		}

		if maxPossibleScore > 0 {
			correctnessScore = (correctnessScore / maxPossibleScore) * 100.0
		} else {
			correctnessScore = 0.0
		}
		
		detailsJson, _ := json.Marshal(results)

		if unknown {
			// Legacy fallback
			if b.SubmissionID != "" {
				_, err := h.db.Exec(`UPDATE submissions SET correctness_details=$1 WHERE id=$2`, detailsJson, b.SubmissionID)
				if err != nil {
					log.Printf("failed to update correctness_details: %v", err)
				}
				h.publishLog(b.SubmissionID, "VALIDATING_CORRECTNESS", "log", "Legacy submission detected. Correctness marked as UNKNOWN.", "SUCCESS")
			}
		} else {
			if b.SubmissionID != "" {
				_, err := h.db.Exec(`UPDATE submissions SET correctness_score=$1, correctness_details=$2 WHERE id=$3`, correctnessScore, detailsJson, b.SubmissionID)
				if err != nil {
					log.Printf("failed to update correctness_score: %v", err)
				}
				h.publishLog(b.SubmissionID, "VALIDATING_CORRECTNESS", "log", fmt.Sprintf("Correctness score: %.2f%%", correctnessScore), "SUCCESS")
			}
		}
	} else {
		log.Printf("failed to run scenario validation: %v", err)
		if b.SubmissionID != "" {
			h.publishLog(b.SubmissionID, "VALIDATING_CORRECTNESS", "log", "Scenario validation failed due to an internal error. Proceeding with benchmark.", "FAILED")
		}
	}
	
	if b.SubmissionID != "" {
		h.setStage(b.SubmissionID, "BENCHMARK", "IN_PROGRESS", "")
		h.publishLog(b.SubmissionID, "BENCHMARK", "log", fmt.Sprintf("Benchmark %s is now RUNNING", b.Name), "IN_PROGRESS")
	}

	// Generate worker JWT
	workerSecret := os.Getenv("WORKER_SECRET")
	var tokenString string
	if workerSecret != "" {
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"benchmark_id": b.ID,
			"role":         "worker",
			"exp":          time.Now().Add(time.Hour * 24).Unix(), // 24 hours expiry
		})
		tokenString, _ = token.SignedString([]byte(workerSecret))
	}

	var traceID string
	if len(b.Metadata) > 0 {
		var metaMap map[string]interface{}
		if err := json.Unmarshal(b.Metadata, &metaMap); err == nil {
			if t, ok := metaMap["trace_id"].(string); ok {
				traceID = t
			}
		}
	}

	traceCtx := make(map[string]string)
	
	tracer := otel.Tracer("benchmark-service")
	ctx, span := tracer.Start(context.Background(), "StartBenchmark")
	defer span.End()
	
	otel.GetTextMapPropagator().Inject(ctx, propagation.MapCarrier(traceCtx))

	workerReqBody, _ := json.Marshal(map[string]interface{}{
		"benchmarkId": b.ID,
		"targetUrl": targetURL,
		"workerCount": b.WorkerCount,
		"totalRequests": b.TotalJobs,
		"submissionId": b.SubmissionID,
		"token": tokenString,
		"traceId": traceID,
		"traceContext": traceCtx,
	})
	
	resp, err := client.Post("http://bot-worker:8085/run", "application/json", bytes.NewBuffer(workerReqBody))
	if err != nil || resp.StatusCode >= 400 {
		log.Printf("failed to trigger bot-worker: %v", err)
		repository.UpdateBenchmarkStatus(h.db, b.ID, "FAILED", 0, 0, 0, 0, 0, 0, 0, 0, "Failed to start bot-worker")
		if b.SubmissionID != "" {
			h.publishLog(b.SubmissionID, "BENCHMARK", "log", "Failed to start bot-worker", "FAILED")
			h.setStage(b.SubmissionID, "BENCHMARK", "FAILED", "Failed to contact bot-worker service")
		}
		
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

	traceID := r.Header.Get("X-Trace-Id")
	if traceID != "" {
		metaMap := make(map[string]interface{})
		if len(req.Metadata) > 0 {
			json.Unmarshal(req.Metadata, &metaMap)
		}
		metaMap["trace_id"] = traceID
		req.Metadata, _ = json.Marshal(metaMap)
	}

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
	
	b, err := repository.UpdateBenchmarkStatus(h.db, id, req.Status, req.TotalRequests, req.SuccessCount, req.FailureCount, req.P50, req.P90, req.P99, req.TracerTotal, req.TracerSuccess, req.FailureReason)
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
			// Check if correctness_score is populated before upserting leaderboard entry
			var correctnessScore sql.NullFloat64
			var correctnessDetails []byte
			if b.SubmissionID != "" {
				err := h.db.QueryRow(`SELECT correctness_score, correctness_details FROM submissions WHERE id=$1`, b.SubmissionID).Scan(&correctnessScore, &correctnessDetails)
				if err != nil && err != sql.ErrNoRows {
					log.Printf("error checking correctness score: %v", err)
				}
			}
			
			if correctnessScore.Valid || len(correctnessDetails) > 0 {
				if err := repository.UpsertLeaderboardEntryFromBenchmark(h.db, id); err != nil {
					log.Printf("leaderboard upsert error: %v", err)
				}
			} else {
				log.Printf("skipping leaderboard upsert for benchmark %s because correctness validation is missing/pending", id)
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

	repository.UpdateBenchmarkStatus(h.db, id, "CANCELLED", b.TotalRequests, b.SuccessCount, b.FailureCount, b.P50, b.P90, b.P99, b.TracerTotal, b.TracerSuccess, "Benchmark was manually cancelled.")
	if b.SubmissionID != "" {
		h.setStage(b.SubmissionID, "BENCHMARK", "FAILED", "Benchmark was manually cancelled.")
	}
	
	updated, _ := repository.GetBenchmarkByID(h.db, id)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}
