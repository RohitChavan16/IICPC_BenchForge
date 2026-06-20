package main

import (
	"context"
	"database/sql"
	"net/http"
	"os"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/logger"
	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/repository"
	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/server"
	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/tracing"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

func main() {
	logger.Init("benchmark-service")

	tp, err := tracing.InitTracer("benchmark-service")
	if err == nil {
		defer tp.Shutdown(context.Background())
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:password@postgres:5432/iicpc?sslmode=disable"
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		logger.Log.Error("failed to open db", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := repository.EnsureLeaderboardTable(db); err != nil {
		logger.Log.Error("failed to ensure leaderboard table", "error", err)
		os.Exit(1)
	}

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis:6379"
	}
	rdb := redis.NewClient(&redis.Options{
		Addr: redisURL,
	})

	srv := &http.Server{
		Addr:         ":8082",
		Handler:      server.NewServer(db, rdb),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	logger.Log.Info("Benchmark service listening :8082")
	if err := srv.ListenAndServe(); err != nil {
		logger.Log.Error("server crashed", "error", err)
		os.Exit(1)
	}
}
