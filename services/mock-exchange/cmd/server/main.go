package main

import (
	"log"

	"github.com/RohitChavan16/IICPC_BenchForge/services/mock-exchange/internal/server"
)

func main() {
	log.Println("Mock Exchange Running On :9000")

	server.StartServer()
}