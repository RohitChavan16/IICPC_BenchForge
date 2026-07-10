package server

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/RohitChavan16/IICPC_BenchForge/services/mock-exchange/internal/handlers"
	"github.com/RohitChavan16/IICPC_BenchForge/services/mock-exchange/internal/metrics"
	"github.com/RohitChavan16/IICPC_BenchForge/services/mock-exchange/internal/middleware"
)

func StartServer(ctx context.Context) {

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
		middleware.Recovery,
		middleware.RequestIDMiddleware,
		middleware.LoggingMiddleware,
	)

	srv := &http.Server{
		Addr:    ":9000",
		Handler: handler,
	}

	go func() {
		log.Println("Mock Exchange Running On :9000")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server crashed: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("Shutting down Mock Exchange gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	} else {
		log.Println("Mock Exchange stopped")
	}
}