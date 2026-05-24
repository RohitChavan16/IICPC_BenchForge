package main

import (
	"log"

	"github.com/redis/go-redis/v9"

	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/aggregator"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/consumer"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/server"
)

func main() {

	rdb := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	agg := aggregator.NewAggregator()

	go consumer.StartConsumer(rdb, agg)

	log.Println("Starting Telemetry Service")

	server.StartServer()
}