package main

import (
	"context"
	"os"

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

	app := server.NewServer(cfg.Port, db, cfg.JWTSecret)

	if err := app.Run(":" + cfg.Port); err != nil {
		logger.Log.Error("server crashed", "error", err)
		os.Exit(1)
	}
}
