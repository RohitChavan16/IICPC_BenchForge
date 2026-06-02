package runner

import (
	"archive/zip"
	"database/sql"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
	"net/http"
)

type Runner struct {
	db        *sql.DB
	uploadDir string
}

func NewRunner(db *sql.DB, uploadDir string) *Runner {
	return &Runner{db: db, uploadDir: uploadDir}
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
	rows, err := r.db.Query(`SELECT id, file_path, language FROM submissions WHERE status='UPLOADED' ORDER BY created_at ASC LIMIT 5`)
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

func (r *Runner) processSubmission(id, filePath, language string) {
	log.Printf("processing submission %s", id)

	// mark BUILDING
	if _, err := r.db.Exec(`UPDATE submissions SET status='BUILDING', updated_at=now() WHERE id=$1`, id); err != nil {
		log.Printf("failed to mark building for %s: %v", id, err)
		return
	}

	// create work dir
	tmpDir, err := os.MkdirTemp("/tmp", "submission-")
	if err != nil {
		r.failSubmission(id, fmt.Sprintf("tempdir: %v", err))
		return
	}
	defer os.RemoveAll(tmpDir)

	// extract zip
	if err := unzip(filePath, tmpDir); err != nil {
		r.failSubmission(id, fmt.Sprintf("unzip: %v", err))
		return
	}

	// detect language (prefer explicit field)
	lang := detectLanguageFromFiles(tmpDir)
	if language != "" {
		lang = strings.ToLower(language)
	}

	// create Dockerfile
	df := dockerfileForLanguage(lang)
	if df == "" {
		r.failSubmission(id, fmt.Sprintf("unsupported language: %s", lang))
		return
	}

	if err := os.WriteFile(filepath.Join(tmpDir, "Dockerfile"), []byte(df), 0644); err != nil {
		r.failSubmission(id, fmt.Sprintf("write Dockerfile: %v", err))
		return
	}

	imageTag := fmt.Sprintf("submission-%s:latest", id)

	// run docker build (best-effort)
	cmd := exec.Command("docker", "build", "-t", imageTag, tmpDir)
	out, err := cmd.CombinedOutput()
	logOutput := string(out)

	if err != nil {
		// Preserve both the exit status and the full docker build output.
		combined := fmt.Sprintf("docker build error: %v\n\n%s", err, logOutput)
		r.failSubmission(id, combined)
		return
	}

	// success
	if _, err := r.db.Exec(`UPDATE submissions SET status='BUILT', container_image=$1, updated_at=now() WHERE id=$2`, imageTag, id); err != nil {
		log.Printf("failed to mark built for %s: %v", id, err)
	}
	r.recordBuildResult(id, imageTag, logOutput)
	log.Printf("built image %s for submission %s", imageTag, id)

	// Trigger deployment
	go func() {
		deploymentURL := os.Getenv("DEPLOYMENT_SERVICE_URL")
		if deploymentURL == "" {
			deploymentURL = "http://deployment-service:8091"
		}
		
		reqBody := fmt.Sprintf(`{"submissionId": "%s"}`, id)
		resp, err := http.Post(deploymentURL+"/api/v1/deployments", "application/json", strings.NewReader(reqBody))
		if err != nil {
			log.Printf("Failed to trigger deployment for submission %s: %v", id, err)
			return
		}
		defer resp.Body.Close()
		if resp.StatusCode >= 400 {
			log.Printf("Failed to trigger deployment for submission %s: status %d", id, resp.StatusCode)
		} else {
			log.Printf("Successfully triggered deployment for submission %s", id)
		}
	}()
}

func (r *Runner) failSubmission(id, reason string) {
	log.Printf("submission %s failed: %s", id, reason)
	if _, err := r.db.Exec(`UPDATE submissions SET status='FAILED', updated_at=now() WHERE id=$1`, id); err != nil {
		log.Printf("failed to mark failed for %s: %v", id, err)
	}
	// append build log
	r.recordBuildResult(id, "", reason)
}

func (r *Runner) recordBuildResult(id, image, logData string) {
	// store build_log and container_image
	if _, err := r.db.Exec(`UPDATE submissions SET container_image=$1, build_log=$2, updated_at=now() WHERE id=$3`, image, logData, id); err != nil {
		log.Printf("failed to record build result for %s: %v", id, err)
	}
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
	// quick heuristic: look for go.mod, Cargo.toml, *.cpp/.cc/.cxx or CMakeLists.txt
	var lang string
	_ = filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil || lang != "" {
			return nil
		}
		name := strings.ToLower(d.Name())
		if name == "go.mod" {
			lang = "go"
			return nil
		}
		if name == "cargo.toml" {
			lang = "rust"
			return nil
		}
		if strings.HasSuffix(name, ".cpp") || strings.HasSuffix(name, ".cc") || strings.HasSuffix(name, ".cxx") || strings.HasSuffix(name, ".c") {
			lang = "cpp"
			return nil
		}
		if name == "cmakelists.txt" {
			lang = "cpp"
			return nil
		}
		return nil
	})
	return lang
}

func dockerfileForLanguage(lang string) string {
	switch strings.ToLower(lang) {
	case "go":
		return `FROM golang:1.22-alpine
WORKDIR /app
COPY . .
RUN go build -o app ./...
CMD ["/app/app"]`
	case "rust":
		return `FROM rust:1.70-slim
WORKDIR /app
COPY . .
RUN cargo build --release
CMD ["/app/target/release/app"]`
	case "cpp":
		return `FROM buildpack-deps:latest
WORKDIR /app
COPY . .
RUN mkdir -p build && cd build && cmake .. && make
CMD ["/app/build/app"]`
	default:
		return ""
	}
}
