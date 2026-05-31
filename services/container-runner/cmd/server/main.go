package main

import (
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/container-runner/internal/runner"
	_ "github.com/lib/pq"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:password@postgres:5432/iicpc?sslmode=disable"
	}

	uploadDir := os.Getenv("SUBMISSION_UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "/data/submissions"
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("failed to open db: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to connect db: %v", err)
	}

	r := runner.NewRunner(db, uploadDir)

	log.Println("container-runner started: polling for submissions")
	// Run loop (blocking)
	r.Run(time.Second * 5)
}
