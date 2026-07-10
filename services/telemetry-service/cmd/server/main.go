package main

import (
	"context"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/aggregator"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/config"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/consumer"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/database"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/server"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/logger"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/tracing"
	ws "github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/websocket"
)

func main() {
    
    logger.Init("telemetry-service")

	tp, err := tracing.InitTracer("telemetry-service")
	if err == nil {
		defer tp.Shutdown(context.Background())
	}

	logger.Log.Info("Starting telemetry service")
	// ROOT CONTEXT
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cfg := config.LoadConfig()

	// REDIS CLIENT
	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisURL,
	})

	// POSTGRES CONNECTION POOL
	// Since database.NewPostgresPool uses os.Getenv, I will set it to the cfg value
	// or we can pass it down. Wait, database.NewPostgresPool currently gets from os.Getenv. Let's see if we should pass cfg to it.
	// Actually, the assignment asks to centralize config. Let me rewrite how db is initialized if possible.
	// Wait, I don't know the signature of database.NewPostgresPool. Let's just set the ENV for it or look at it.
	// We'll leave db = database.NewPostgresPool() as is if it relies on os.Getenv, but the config package verifies it exists.
	db := database.NewPostgresPool()
	defer db.Close()

	// WEBSOCKET HUB
	hub := ws.NewHub()

	// METRICS AGGREGATOR
	agg := aggregator.NewAggregator()

	// WORKER STATE (shared between consumer and server)
	workerAggs := make(map[string]*aggregator.Aggregator)
	workerLastSeen := make(map[string]time.Time)
	var workerMu sync.Mutex

	// CREATE REDIS CONSUMER GROUP
	consumer.CreateConsumerGroup(rdb)

	// START TELEMETRY CONSUMER
	go consumer.StartConsumer(
		cfg,
		ctx,
		rdb,
		db,
		agg,
		workerAggs,
		workerLastSeen,
		&workerMu,
		hub,
	)

	// START REPLAY PROCESSOR WORKER
	go aggregator.StartReplayProcessorWorker(ctx, db, cfg)

	// START HTTP SERVER
	go server.StartServer(ctx, cfg, hub, workerAggs, workerLastSeen, &workerMu, db, rdb)

	// SIGNAL CHANNEL
	sigChan := make(chan os.Signal, 1)

	// LISTEN FOR TERMINATION SIGNALS
	signal.Notify(
		sigChan,
		syscall.SIGINT,
		syscall.SIGTERM,
	)

	// BLOCK UNTIL SIGNAL RECEIVED
	sig := <-sigChan

	logger.Log.Info(
	"Received shutdown signal",
	"signal",
	sig.String(),
)

	// CANCEL CONTEXT
	cancel()

	logger.Log.Info("Telemetry service stopped gracefully")
}