package runner

import (
	"archive/zip"
	"bufio"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

type Runner struct {
	db        *sql.DB
	rdb       *redis.Client
	uploadDir string
}

func NewRunner(db *sql.DB, rdb *redis.Client, uploadDir string) *Runner {
	return &Runner{db: db, rdb: rdb, uploadDir: uploadDir}
}

// Run starts a polling loop checking for UPLOADED submissions.
func (r *Runner) Run(pollInterval time.Duration) {
	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()
	for {
		r.pollOnce()
		<-ticker.C
	}
}

func (r *Runner) pollOnce() {
	rows, err := r.db.Query(`SELECT id, file_path, language FROM submissions WHERE status='UPLOADED' AND (current_stage IS NULL OR current_stage='UPLOAD') ORDER BY created_at ASC LIMIT 5`)
	if err != nil {
		log.Printf("poll query error: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id, filePath, language string
		if err := rows.Scan(&id, &filePath, &language); err != nil {
			log.Printf("row scan error: %v", err)
			continue
		}
		go r.processSubmission(id, filePath, language)
	}
}

type LogMessage struct {
	Timestamp   string `json:"timestamp"`
	Stage       string `json:"stage"`
	Type        string `json:"type"`
	Message     string `json:"message"`
	StageStatus string `json:"stage_status"`
}

func (r *Runner) publishLog(id, stage, msgType, message, status string) {
	msg := LogMessage{
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
		Stage:       stage,
		Type:        msgType,
		Message:     message,
		StageStatus: status,
	}
	data, _ := json.Marshal(msg)
	r.rdb.Publish(context.Background(), "pipeline_logs:"+id, data)

	// Persist to DB if it's a log
	if msgType == "log" && message != "" {
		_, err := r.db.Exec(`INSERT INTO submission_logs (submission_id, stage, message) VALUES ($1, $2, $3)`, id, stage, message)
		if err != nil {
			log.Printf("Failed to insert log for %s: %v", id, err)
		}
	}
}

func (r *Runner) setStage(id, stage, status, reason string) {
	query := `UPDATE submissions SET current_stage=$1, stage_status=$2, failure_reason=$3, updated_at=now()`
	if stage == "BUILD" && status == "IN_PROGRESS" {
		query += `, started_at=now()`
	}
	if status == "FAILED" || status == "SUCCESS" {
		if stage == "BENCHMARK" || status == "FAILED" { // Pipeline ends on any failure or after benchmark
			query += `, finished_at=now()`
		}
	}
	
	// Legacy status field for compatibility
	legacyStatus := "BUILDING"
	if status == "FAILED" {
		legacyStatus = "FAILED"
	} else if status == "SUCCESS" {
		legacyStatus = "BUILT"
	}
	query += fmt.Sprintf(`, status='%s' WHERE id=$4`, legacyStatus)

	_, err := r.db.Exec(query, stage, status, reason, id)
	if err != nil {
		log.Printf("failed to set stage for %s: %v", id, err)
	}
	r.publishLog(id, stage, "state_change", reason, status)
}

func (r *Runner) processSubmission(id, filePath, language string) {
	log.Printf("processing submission %s", id)

	r.setStage(id, "BUILD", "IN_PROGRESS", "")
	r.publishLog(id, "BUILD", "log", "Build started", "IN_PROGRESS")

	// create work dir
	tmpDir, err := os.MkdirTemp("/tmp", "submission-")
	if err != nil {
		r.failSubmission(id, fmt.Sprintf("tempdir error: %v", err))
		return
	}
	defer os.RemoveAll(tmpDir)

	// extract zip
	r.publishLog(id, "BUILD", "log", "Extracting submission zip", "IN_PROGRESS")
	if err := unzip(filePath, tmpDir); err != nil {
		r.failSubmission(id, fmt.Sprintf("failed to extract zip: %v", err))
		return
	}

	// detect language
	lang := detectLanguageFromFiles(tmpDir)
	if language != "" {
		lang = strings.ToLower(language)
	}

	// create Dockerfile
	df := dockerfileForLanguage(lang)
	if df == "" {
		r.failSubmission(id, fmt.Sprintf("Unsupported language detected: %s. Supported languages are: go, rust, cpp.", lang))
		return
	}

	r.publishLog(id, "BUILD", "log", fmt.Sprintf("Detected language: %s. Creating Dockerfile.", lang), "IN_PROGRESS")
	if err := os.WriteFile(filepath.Join(tmpDir, "Dockerfile"), []byte(df), 0644); err != nil {
		r.failSubmission(id, fmt.Sprintf("failed to write Dockerfile: %v", err))
		return
	}

	imageTag := fmt.Sprintf("submission-%s:latest", id)
	r.publishLog(id, "BUILD", "log", "Starting docker build", "IN_PROGRESS")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()
	cmd := exec.CommandContext(ctx, "docker", "build", "-t", imageTag, tmpDir)
	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()
	
	if err := cmd.Start(); err != nil {
		r.failSubmission(id, fmt.Sprintf("Failed to start docker build: %v", err))
		return
	}

	// Stream logs
	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			r.publishLog(id, "BUILD", "log", scanner.Text(), "IN_PROGRESS")
		}
	}()
	go func() {
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			r.publishLog(id, "BUILD", "log", scanner.Text(), "IN_PROGRESS")
		}
	}()

	err = cmd.Wait()
	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			r.failSubmission(id, "Docker build failed: Timed out after 5 minutes.")
			return
		}
		r.failSubmission(id, fmt.Sprintf("Docker build failed: %v. Check build logs for details.", err))
		return
	}

	r.publishLog(id, "BUILD", "log", "Build completed successfully", "SUCCESS")
	r.setStage(id, "BUILD", "SUCCESS", "")

	// store container_image
	r.db.Exec(`UPDATE submissions SET container_image=$1, updated_at=now() WHERE id=$2`, imageTag, id)

	// Trigger deployment
	go func() {
		deploymentURL := os.Getenv("DEPLOYMENT_SERVICE_URL")
		if deploymentURL == "" {
			deploymentURL = "http://deployment-service:8091"
		}
		
		r.publishLog(id, "DEPLOYMENT", "state_change", "Triggering deployment", "IN_PROGRESS")
		reqBody := fmt.Sprintf(`{"submissionId": "%s"}`, id)
		resp, err := http.Post(deploymentURL+"/deployments", "application/json", strings.NewReader(reqBody))
		if err != nil {
			msg := fmt.Sprintf("Failed to trigger deployment for submission %s: %v", id, err)
			log.Println(msg)
			r.publishLog(id, "DEPLOYMENT", "log", msg, "FAILED")
			r.setStage(id, "DEPLOYMENT", "FAILED", "Deployment trigger failed")
			return
		}
		defer resp.Body.Close()
	}()
}

func (r *Runner) failSubmission(id, reason string) {
	log.Printf("submission %s failed: %s", id, reason)
	r.publishLog(id, "BUILD", "log", "Build failed: "+reason, "FAILED")
	r.setStage(id, "BUILD", "FAILED", reason)
}

func unzip(src, dest string) error {
	r, err := zip.OpenReader(src)
	if err != nil {
		return err
	}
	defer r.Close()

	for _, f := range r.File {
		fpath := filepath.Join(dest, f.Name)
		if f.FileInfo().IsDir() {
			os.MkdirAll(fpath, os.ModePerm)
			continue
		}
		if err := os.MkdirAll(filepath.Dir(fpath), os.ModePerm); err != nil {
			return err
		}
		rc, err := f.Open()
		if err != nil {
			return err
		}
		defer rc.Close()
		outFile, err := os.OpenFile(fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			return err
		}
		if _, err := io.Copy(outFile, rc); err != nil {
			outFile.Close()
			return err
		}
		outFile.Close()
	}
	return nil
}

func detectLanguageFromFiles(root string) string {
	var lang string
	_ = filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil || lang != "" { return nil }
		name := strings.ToLower(d.Name())
		if name == "go.mod" { lang = "go" }
		if name == "cargo.toml" { lang = "rust" }
		if strings.HasSuffix(name, ".cpp") || strings.HasSuffix(name, ".cc") || strings.HasSuffix(name, ".cxx") || strings.HasSuffix(name, ".c") { lang = "cpp" }
		if name == "cmakelists.txt" { lang = "cpp" }
		return nil
	})
	return lang
}

func dockerfileForLanguage(lang string) string {
	switch strings.ToLower(lang) {
	case "go": return "FROM golang:alpine\nWORKDIR /app\nCOPY . .\nRUN go build -o app ./...\nCMD [\"/app/app\"]"
	case "rust": return "FROM rust:1.70-slim\nWORKDIR /app\nCOPY . .\nRUN cargo build --release\nCMD [\"/app/target/release/app\"]"
	case "cpp": return "FROM buildpack-deps:latest\nWORKDIR /app\nCOPY . .\nRUN mkdir -p build && cd build && cmake .. && make\nCMD [\"/app/build/app\"]"
	default: return ""
	}
}
