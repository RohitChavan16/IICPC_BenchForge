package main

import (
	"context"
	"database/sql"
	"net/http"
	"os"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/config"
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

	cfg := config.LoadConfig()

	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		logger.Log.Error("failed to open db", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := repository.EnsureLeaderboardTable(db); err != nil {
		logger.Log.Error("failed to ensure leaderboard table", "error", err)
		os.Exit(1)
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisURL,
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      server.NewServer(cfg, db, rdb),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	logger.Log.Info("Benchmark service listening :" + cfg.Port)
	if err := srv.ListenAndServe(); err != nil {
		logger.Log.Error("server crashed", "error", err)
		os.Exit(1)
	}
}
