package server

import (
	"log"
	"net/http"

	ws "github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/websocket"
)

func StartServer() {

	http.HandleFunc("/ws", ws.HandleConnections)

	log.Println("Telemetry Service Running :8081")

	http.ListenAndServe(":8081", nil)
}