package main

import (
	"database/sql"
	"log"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/container-runner/internal/config"
	"github.com/RohitChavan16/IICPC_BenchForge/services/container-runner/internal/runner"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

func main() {
	cfg := config.LoadConfig()

	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to open db: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to connect db: %v", err)
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisURL,
	})

	r := runner.NewRunner(cfg, db, rdb, cfg.SubmissionUploadDir)

	log.Println("container-runner started: polling for submissions")
	// Run loop (blocking)
	r.Run(time.Second * 5)
}
