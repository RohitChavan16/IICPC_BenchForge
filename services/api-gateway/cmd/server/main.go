package main

import (
	"log"

	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/config"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/database"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/server"
)

func main() {
	cfg := config.LoadConfig()

	db, err := database.NewPostgresDB(cfg.PostgresURL)
	if err != nil {
		log.Fatal("failed to connect to database: ", err)
	}

	if err := database.EnsureAuthUsersTable(db); err != nil {
		log.Fatal("failed to ensure auth_users table: ", err)
	}

	app := server.NewServer(cfg.Port, db, cfg.JWTSecret)

	log.Fatal(app.Run(":" + cfg.Port))
}
