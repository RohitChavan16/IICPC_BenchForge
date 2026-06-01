package handlers

import (
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

	"github.com/RohitChavan16/IICPC_BenchForge/services/submission-service/internal/repository"
)

const maxUploadSize = 100 << 20

var allowedLanguages = map[string]bool{
	"go":   true,
	"cpp":  true,
	"rust": true,
}

type SubmissionHandler struct {
	db        *sql.DB
	uploadDir string
}

func NewSubmissionHandler(db *sql.DB, uploadDir string) *SubmissionHandler {
	return &SubmissionHandler{
		db:        db,
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

	submission, err := repository.CreateSubmission(h.db, teamName, submissionName, language, storedPath, userID, teamID)
	if err != nil {
		log.Printf("create submission error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

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
