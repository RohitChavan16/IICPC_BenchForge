package server

import (
	"log"
	"net/http"

	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/RohitChavan16/IICPC_BenchForge/services/mock-exchange/internal/handlers"
	"github.com/RohitChavan16/IICPC_BenchForge/services/mock-exchange/internal/metrics"
	"github.com/RohitChavan16/IICPC_BenchForge/services/mock-exchange/internal/middleware"
)

func StartServer() {

	// INITIALIZE PROMETHEUS METRICS
	metrics.Init()

	// CREATE ROUTER
	mux := http.NewServeMux()

	// PROMETHEUS METRICS ENDPOINT
	mux.Handle(
		"/metrics",
		promhttp.Handler(),
	)

	// APPLICATION ROUTES
	mux.HandleFunc("/health", handlers.HealthHandler)
	mux.HandleFunc("/order", handlers.OrderHandler)
	mux.HandleFunc("/cancel", handlers.CancelHandler)

	// MIDDLEWARE CHAIN
	handler := middleware.Chain(
		mux,
		middleware.RequestIDMiddleware,
		middleware.LoggingMiddleware,
	)

	log.Println("Mock Exchange Running On :9000")

	err := http.ListenAndServe(":9000", handler)

	if err != nil {
		log.Fatal(err)
	}
}