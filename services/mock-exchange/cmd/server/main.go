package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
)

	"github.com/RohitChavan16/IICPC_BenchForge/services/mock-exchange/internal/server"
	"github.com/RohitChavan16/IICPC_BenchForge/services/mock-exchange/internal/logger"
)

func main() {
	log.Println("Mock Exchange Running On :9000")
	logger.Init("mock-exchange")

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	server.StartServer(ctx)
	
}