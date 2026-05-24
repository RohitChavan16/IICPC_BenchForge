package main

import (
	"log"

	"github.com/redis/go-redis/v9"

	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/aggregator"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/consumer"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/database"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/server"
	ws "github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/websocket"
)

func main() {

	rdb := redis.NewClient(&redis.Options{
		Addr: "redis:6379",
	})

	db := database.NewPostgresPool()

	hub := ws.NewHub()

	agg := aggregator.NewAggregator()

	consumer.CreateConsumerGroup(rdb)

	go consumer.StartConsumer(
		rdb,
		db,
		agg,
		hub,
	)

	log.Println("Starting Telemetry Service")

	server.StartServer(hub)
}