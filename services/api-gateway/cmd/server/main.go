package main

import (
	"log"

	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/config"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/server"
)

func main() {
	cfg := config.LoadConfig()

	app := server.NewServer(cfg.Port)

	log.Fatal(app.Run(":" + cfg.Port))
}