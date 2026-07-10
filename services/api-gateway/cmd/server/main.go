package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/config"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/database"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/logger"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/server"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/tracing"
)

func main() {
	logger.Init("api-gateway")

	tp, err := tracing.InitTracer("api-gateway")
	if err == nil {
		defer tp.Shutdown(context.Background())
	}

	cfg := config.LoadConfig()

	db, err := database.NewPostgresDB(cfg.PostgresURL)
	if err != nil {
		logger.Log.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}

	if err := database.EnsureAuthUsersTable(db); err != nil {
		logger.Log.Error("failed to ensure auth_users table", "error", err)
		os.Exit(1)
	}

	app := server.NewServer(cfg, db, cfg.JWTSecret)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: app,
	}

	go func() {
		logger.Log.Info("API Gateway listening :" + cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Log.Error("server crashed", "error", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	logger.Log.Info("Shutting down API Gateway gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Log.Error("graceful shutdown failed", "error", err)
	} else {
		logger.Log.Info("API Gateway stopped")
	}
}
