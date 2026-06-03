package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/redis/go-redis/v9"

	"github.com/RohitChavan16/IICPC_BenchForge/services/deployment-service/internal/deployer"
	"github.com/RohitChavan16/IICPC_BenchForge/services/deployment-service/internal/repository"
)

type Handler struct {
	db                *sql.DB
	rdb               *redis.Client
	deployer          *deployer.Deployer
	portStart         int
	portEnd           int
	deploymentNetwork string
}

func NewHandler(db *sql.DB, rdb *redis.Client) *Handler {
	ps := 30000
	pe := 31000
	if v := os.Getenv("DEPLOY_PORT_START"); v != "" {
		if n, err := strconv.Atoi(v); err == nil { ps = n }
	}
	if v := os.Getenv("DEPLOY_PORT_END"); v != "" {
		if n, err := strconv.Atoi(v); err == nil { pe = n }
	}
	network := os.Getenv("DEPLOY_NETWORK")
	if network == "" {
		network = "iicpc_benchforge_default"
	}
	return &Handler{db: db, rdb: rdb, deployer: deployer.NewDeployer(db), portStart: ps, portEnd: pe, deploymentNetwork: network}
}

func (h *Handler) ListDeployments(w http.ResponseWriter, r *http.Request) {
	items, err := repository.ListDeployments(h.db, 100)
	if err != nil {
		log.Printf("list deployments error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"items": items})
}

func (h *Handler) GetDeployment(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	d, err := repository.GetDeploymentByID(h.db, id)
	if err != nil {
		if err == sql.ErrNoRows {
			http.NotFound(w, r)
			return
		}
		log.Printf("get deployment error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(d)
}

type createReq struct {
	SubmissionID  string `json:"submissionId"`
	ContainerPort int    `json:"containerPort,omitempty"`
}

type LogMessage struct {
	Timestamp   string `json:"timestamp"`
	Stage       string `json:"stage"`
	Type        string `json:"type"`
	Message     string `json:"message"`
	StageStatus string `json:"stage_status"`
}

func (h *Handler) publishLog(subID, stage, msgType, message, status string) {
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

func (h *Handler) setStage(subID, stage, status, reason string) {
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

func (h *Handler) CreateDeployment(w http.ResponseWriter, r *http.Request) {
	var req createReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if req.SubmissionID == "" {
		http.Error(w, "submissionId required", http.StatusBadRequest)
		return
	}

	h.setStage(req.SubmissionID, "DEPLOYMENT", "IN_PROGRESS", "")
	h.publishLog(req.SubmissionID, "DEPLOYMENT", "log", "Allocating host port and starting container", "IN_PROGRESS")

	// choose containerPort
	cp := 8080
	if req.ContainerPort != 0 {
		cp = req.ContainerPort
	}

	var containerImage string
	err := h.db.QueryRow(`SELECT container_image FROM submissions WHERE id=$1`, req.SubmissionID).Scan(&containerImage)
	if err != nil || containerImage == "" {
		h.failStage(req.SubmissionID, "DEPLOYMENT", "Submission not built or missing image")
		http.Error(w, "submission not built", http.StatusBadRequest)
		return
	}

	userID := r.Header.Get("X-User-Id")
	teamID := r.Header.Get("X-Team-Id")

	dep, err := repository.CreateDeployment(h.db, req.SubmissionID, userID, teamID, cp)
	if err != nil {
		h.failStage(req.SubmissionID, "DEPLOYMENT", fmt.Sprintf("Failed to create deployment record: %v", err))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	hostPort, err := h.deployer.AllocatePort(h.db, h.portStart, h.portEnd)
	if err != nil {
		repository.UpdateDeployment(h.db, dep.ID, "", "", 0, "FAILED")
		h.failStage(req.SubmissionID, "DEPLOYMENT", "No available host ports for deployment")
		http.Error(w, "no available host ports", http.StatusInternalServerError)
		return
	}

	repository.UpdateDeployment(h.db, dep.ID, "", "", hostPort, "DEPLOYING")
	_ = repository.AppendDeploymentLog(h.db, dep.ID, fmt.Sprintf("allocated host_port=%d, container_port=%d", hostPort, cp))

	name := fmt.Sprintf("deployment-%s", dep.ID)
	h.publishLog(req.SubmissionID, "DEPLOYMENT", "log", fmt.Sprintf("Running docker container %s on port %d", name, hostPort), "IN_PROGRESS")
	
	containerID, runOutput, err := h.deployer.RunContainer(containerImage, hostPort, cp, name, h.deploymentNetwork)
	if err != nil {
		_ = repository.AppendDeploymentLog(h.db, dep.ID, fmt.Sprintf("docker run error: %v\n\n%s", err, runOutput))
		repository.UpdateDeployment(h.db, dep.ID, "", "", hostPort, "FAILED")
		h.failStage(req.SubmissionID, "DEPLOYMENT", fmt.Sprintf("Docker run failed: %v", err))
		http.Error(w, "failed to start container", http.StatusInternalServerError)
		return
	}

	_ = repository.AppendDeploymentLog(h.db, dep.ID, fmt.Sprintf("docker run output:\n%s", runOutput))
	repository.UpdateDeployment(h.db, dep.ID, containerID, containerImage, hostPort, "RUNNING")
	
	h.publishLog(req.SubmissionID, "DEPLOYMENT", "log", "Deployment successful", "SUCCESS")
	h.setStage(req.SubmissionID, "DEPLOYMENT", "SUCCESS", "")

	d, _ := repository.GetDeploymentByID(h.db, dep.ID)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(d)

	go h.runValidationAndBenchmark(req.SubmissionID, dep.ID, name, cp, userID, teamID)
}

func (h *Handler) failStage(subID, stage, reason string) {
	h.publishLog(subID, stage, "log", fmt.Sprintf("%s failed: %s", stage, reason), "FAILED")
	h.setStage(subID, stage, "FAILED", reason)
}

func (h *Handler) runValidationAndBenchmark(subID, depID, containerName string, cp int, userID, teamID string) {
	// Give container a few seconds to fully boot
	time.Sleep(3 * time.Second)

	h.setStage(subID, "VALIDATION", "IN_PROGRESS", "")
	h.publishLog(subID, "VALIDATION", "log", "Starting validation checks", "IN_PROGRESS")

	targetURL := fmt.Sprintf("http://%s:%d", containerName, cp)

	// Step 1: Health Check
	h.publishLog(subID, "VALIDATION", "log", "Checking GET /health", "IN_PROGRESS")
	client := http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(targetURL + "/health")
	if err != nil {
		h.recordValidationResult(subID, false, fmt.Sprintf("GET /health failed: %v", err))
		h.failStage(subID, "VALIDATION", fmt.Sprintf("Container unreachable or GET /health failed: %v", err))
		return
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		h.recordValidationResult(subID, false, fmt.Sprintf("GET /health returned status %d", resp.StatusCode))
		h.failStage(subID, "VALIDATION", fmt.Sprintf("GET /health returned status %d (expected 200)", resp.StatusCode))
		return
	}
	h.publishLog(subID, "VALIDATION", "log", "GET /health OK", "IN_PROGRESS")

	// Step 2: POST /order check
	h.publishLog(subID, "VALIDATION", "log", "Checking POST /order endpoint", "IN_PROGRESS")
	payload := `{"symbol":"AAPL","price":100.0,"quantity":1,"side":"buy"}`
	resp2, err := client.Post(targetURL+"/order", "application/json", strings.NewReader(payload))
	if err != nil {
		h.recordValidationResult(subID, false, fmt.Sprintf("POST /order failed: %v", err))
		h.failStage(subID, "VALIDATION", fmt.Sprintf("POST /order request failed: %v", err))
		return
	}
	resp2.Body.Close()
	if resp2.StatusCode < 200 || resp2.StatusCode >= 300 {
		h.recordValidationResult(subID, false, fmt.Sprintf("POST /order returned status %d", resp2.StatusCode))
		reason := fmt.Sprintf("POST /order returned status %d", resp2.StatusCode)
		if resp2.StatusCode == 404 {
			reason = "POST /order endpoint not found (404)"
		} else if resp2.StatusCode == 405 {
			reason = "POST /order method not allowed (405)"
		}
		h.failStage(subID, "VALIDATION", reason)
		return
	}
	h.publishLog(subID, "VALIDATION", "log", "POST /order OK", "IN_PROGRESS")
	
	h.recordValidationResult(subID, true, "")
	h.publishLog(subID, "VALIDATION", "log", "Validation successful", "SUCCESS")
	h.setStage(subID, "VALIDATION", "SUCCESS", "")

	// Trigger benchmark automatically
	h.triggerBenchmark(subID, depID, userID, teamID)
}

func (h *Handler) recordValidationResult(subID string, passed bool, details string) {
	_, err := h.db.Exec(`INSERT INTO validation_results (submission_id, passed, error_details) VALUES ($1, $2, $3)`, subID, passed, details)
	if err != nil {
		log.Printf("Failed to record validation result for %s: %v", subID, err)
	}
}

func (h *Handler) triggerBenchmark(subID, depID, userID, teamID string) {
	h.setStage(subID, "BENCHMARK", "IN_PROGRESS", "")
	h.publishLog(subID, "BENCHMARK", "log", "Triggering benchmark execution", "IN_PROGRESS")

	benchmarkURL := os.Getenv("BENCHMARK_SERVICE_URL")
	if benchmarkURL == "" {
		benchmarkURL = "http://benchmark-service:8082"
	}
	
	reqBody := fmt.Sprintf(`{
		"name": "AutoBench-%s",
		"targetType": "deployment",
		"submissionId": "%s",
		"deploymentId": "%s",
		"workerCount": 100,
		"totalRequests": 5000
	}`, depID[:8], subID, depID)
	
	benchReq, err := http.NewRequest("POST", benchmarkURL+"/benchmarks", strings.NewReader(reqBody))
	if err != nil {
		h.failStage(subID, "BENCHMARK", fmt.Sprintf("Failed to construct benchmark request: %v", err))
		return
	}
	benchReq.Header.Set("Content-Type", "application/json")
	benchReq.Header.Set("X-User-Id", userID)
	benchReq.Header.Set("X-Team-Id", teamID)
	
	var teamName string
	_ = h.db.QueryRow(`SELECT team_name FROM submissions WHERE id=$1`, subID).Scan(&teamName)
	if teamName != "" {
		benchReq.Header.Set("X-Team-Name", teamName)
	}

	resp, err := http.DefaultClient.Do(benchReq)
	if err != nil {
		h.failStage(subID, "BENCHMARK", fmt.Sprintf("Failed to contact benchmark service: %v", err))
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		var errResp map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errResp)
		h.failStage(subID, "BENCHMARK", fmt.Sprintf("Benchmark service returned status %d", resp.StatusCode))
	} else {
		h.publishLog(subID, "BENCHMARK", "log", "Benchmark successfully queued", "IN_PROGRESS")
	}
}

func (h *Handler) StopDeployment(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	d, err := repository.GetDeploymentByID(h.db, id)
	if err != nil {
		if err == sql.ErrNoRows {
			http.NotFound(w, r)
			return
		}
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	if d.ContainerID == "" {
		http.Error(w, "no container to stop", http.StatusBadRequest)
		return
	}
	stopOutput, err := h.deployer.StopContainer(d.ContainerID)
	if err != nil {
		_ = repository.AppendDeploymentLog(h.db, id, fmt.Sprintf("docker stop/rm error: %v\n%s", err, stopOutput))
		repository.StopDeployment(h.db, id, "FAILED")
		http.Error(w, "failed to stop container", http.StatusInternalServerError)
		return
	}
	_ = repository.AppendDeploymentLog(h.db, id, fmt.Sprintf("docker stop/rm output:\n%s", stopOutput))
	repository.StopDeployment(h.db, id, "STOPPED")
	updated, _ := repository.GetDeploymentByID(h.db, id)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}
