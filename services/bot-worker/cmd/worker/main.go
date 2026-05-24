package main

import (
	"fmt"
	"time"
    "github.com/redis/go-redis/v9"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/metrics"
	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/workers"
)

func main() {

	totalJobs := 1000
	totalWorkers := 100
    rdb := redis.NewClient(&redis.Options{
		Addr: "redis:6379",
	})
	jobs := make(chan int, totalJobs)
	results := make(chan metrics.RequestMetric, totalJobs)

	exchangeURL := "http://mock-exchange:9000"

	for w := 1; w <= totalWorkers; w++ {
		go workers.Worker(w, jobs, results, exchangeURL, rdb)
	}

	start := time.Now()

	for j := 1; j <= totalJobs; j++ {
		jobs <- j
	}

	close(jobs)

	success := 0

	for a := 1; a <= totalJobs; a++ {
		result := <-results

		if result.Success {
			success++
		}
	}

	duration := time.Since(start)

	tps := float64(totalJobs) / duration.Seconds()

	fmt.Println("================================")
	fmt.Println("Benchmark Complete")
	fmt.Println("================================")
	fmt.Println("Total Requests:", totalJobs)
	fmt.Println("Successful:", success)
	fmt.Println("Duration:", duration)
	fmt.Printf("TPS: %.2f\n", tps)
}