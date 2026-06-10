package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"

	"github.com/RohitChavan16/IICPC_BenchForge/services/submission-service/internal/repository"
)

const maxUploadSize = 100 << 20

var allowedLanguages = map[string]bool{
	"go":   true,
	"cpp":  true,
	"rust": true,
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for now
	},
}

type SubmissionHandler struct {
	db        *sql.DB
	rdb       *redis.Client
	uploadDir string
}

func NewSubmissionHandler(db *sql.DB, rdb *redis.Client, uploadDir string) *SubmissionHandler {
	return &SubmissionHandler{
		db:        db,
		rdb:       rdb,
		uploadDir: uploadDir,
	}
}

func (h *SubmissionHandler) ListSubmissions(w http.ResponseWriter, r *http.Request) {
	items, err := repository.ListSubmissions(h.db, 100)
	if err != nil {
		log.Printf("list submissions error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"items": items})
}

func (h *SubmissionHandler) CreateSubmission(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		http.Error(w, "invalid multipart form or file too large", http.StatusBadRequest)
		return
	}

	teamName := strings.TrimSpace(r.FormValue("teamName"))
	submissionName := strings.TrimSpace(r.FormValue("submissionName"))
	language := strings.ToLower(strings.TrimSpace(r.FormValue("language")))

	if teamName == "" || submissionName == "" || language == "" {
		http.Error(w, "teamName, submissionName, and language are required", http.StatusBadRequest)
		return
	}
	if !allowedLanguages[language] {
		http.Error(w, "language must be one of: go, cpp, rust", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "file is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	if strings.ToLower(filepath.Ext(header.Filename)) != ".zip" {
		http.Error(w, "file must be a .zip archive", http.StatusBadRequest)
		return
	}

	storedPath, err := h.storeUpload(file, teamName, submissionName, header.Filename)
	if err != nil {
		log.Printf("store submission error: %v", err)
		http.Error(w, "failed to store submission", http.StatusInternalServerError)
		return
	}

	userID := r.Header.Get("X-User-Id")
	teamID := r.Header.Get("X-Team-Id")
	fileSizeBytes := header.Size

	submission, err := repository.CreateSubmission(h.db, teamName, submissionName, language, storedPath, fileSizeBytes, userID, teamID)
	if err != nil {
		log.Printf("create submission error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	// Update pipeline state to UPLOAD SUCCESS
	_, _ = h.db.Exec(`UPDATE submissions SET current_stage='UPLOAD', stage_status='SUCCESS', started_at=now() WHERE id=$1`, submission.ID)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Location", "/submissions/"+submission.ID)
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(submission)
}

func (h *SubmissionHandler) GetSubmissionByID(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	submission, err := repository.GetSubmissionByID(h.db, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.NotFound(w, r)
			return
		}
		log.Printf("get submission error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(submission)
}

func (h *SubmissionHandler) StreamLogs(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("websocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	// 1. Fetch historical logs from DB and send them
	rows, err := h.db.Query(`SELECT stage, message, created_at FROM submission_logs WHERE submission_id=$1 ORDER BY id ASC`, id)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var stage, msg string
			var createdAt time.Time
			if err := rows.Scan(&stage, &msg, &createdAt); err == nil {
				logData := map[string]interface{}{
					"stage":     stage,
					"message":   msg,
					"timestamp": createdAt.UTC().Format(time.RFC3339),
					"type":      "log",
				}
				if err := conn.WriteJSON(logData); err != nil {
					log.Printf("failed to write history to websocket: %v", err)
					return // Client disconnected
				}
			}
		}
	} else {
		log.Printf("failed to query historical logs: %v", err)
	}

	// 2. Subscribe to Redis for new logs
	pubsub := h.rdb.Subscribe(context.Background(), "pipeline_logs:"+id)
	defer pubsub.Close()
	ch := pubsub.Channel()

	for msg := range ch {
		var logMsg map[string]interface{}
		if err := json.Unmarshal([]byte(msg.Payload), &logMsg); err == nil {
			if err := conn.WriteJSON(logMsg); err != nil {
				// Client disconnected
				break
			}
		}
	}
}

func (h *SubmissionHandler) storeUpload(src io.Reader, teamName, submissionName, originalName string) (string, error) {
	if err := os.MkdirAll(h.uploadDir, 0755); err != nil {
		return "", err
	}

	filename := fmt.Sprintf(
		"%s_%s_%d_%s",
		safeName(teamName),
		safeName(submissionName),
		time.Now().UTC().UnixNano(),
		filepath.Base(originalName),
	)
	path := filepath.Join(h.uploadDir, filename)

	dst, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0644)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", err
	}
	return path, nil
}

func safeName(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	var b strings.Builder
	for _, r := range value {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			continue
		}
		b.WriteByte('-')
	}
	cleaned := strings.Trim(b.String(), "-")
	if cleaned == "" {
		return "submission"
	}
	return cleaned
}
