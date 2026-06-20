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

	// REDIS CLIENT
	rdb := redis.NewClient(&redis.Options{
		Addr: os.Getenv("REDIS_URL"),
	})

	// POSTGRES CONNECTION POOL
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
	go aggregator.StartReplayProcessorWorker(ctx, db)

	// START HTTP SERVER
	go server.StartServer(hub, workerAggs, workerLastSeen, &workerMu, db, rdb)

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

	// ALLOW GOROUTINES TO FINISH
	time.Sleep(2 * time.Second)

	logger.Log.Info("Telemetry service stopped gracefully")
}