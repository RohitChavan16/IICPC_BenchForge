package main

import (
	"log"

	"github.com/RohitChavan16/IICPC_BenchForge/services/mock-exchange/internal/server"
	"github.com/RohitChavan16/IICPC_BenchForge/services/mock-exchange/internal/logger"
)

func main() {
	log.Println("Mock Exchange Running On :9000")
	logger.Init("mock-exchange")

	server.StartServer()
	
}