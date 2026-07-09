package main

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/submission-service/internal/config"
	"github.com/RohitChavan16/IICPC_BenchForge/services/submission-service/internal/server"
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

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      server.NewServer(db, rdb, cfg.SubmissionUploadDir),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	log.Println("Submission service listening :" + cfg.Port)
	log.Fatal(srv.ListenAndServe())
}
