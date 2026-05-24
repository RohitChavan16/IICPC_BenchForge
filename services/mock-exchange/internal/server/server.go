package server

import (
	"net/http"

	"github.com/RohitChavan16/IICPC_BenchForge/services/mock-exchange/internal/handlers"
)

func StartServer() {
	http.HandleFunc("/health", handlers.HealthHandler)
	http.HandleFunc("/order", handlers.OrderHandler)
	http.HandleFunc("/cancel", handlers.CancelHandler)

	http.ListenAndServe(":9000", nil)
}