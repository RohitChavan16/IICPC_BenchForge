package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	ExchangeURL         string
	Workers             int
	BenchmarkServiceURL string
	RedisURL            string
}

func getEnvOrFatal(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("Fatal: Missing required environment variable: %s", key)
	}
	return val
}

func getEnvOrDefault(key, defaultVal string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	return val
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("Note: .env file not found, relying on environment variables.")
	}

	workers, _ := strconv.Atoi(getEnvOrDefault("WORKERS", "100"))

	return &Config{
		ExchangeURL:         getEnvOrDefault("EXCHANGE_URL", "http://mock-exchange:8080"),
		Workers:             workers,
		BenchmarkServiceURL: getEnvOrFatal("BENCHMARK_SERVICE_URL"),
		RedisURL:            getEnvOrFatal("REDIS_URL"),
	}
}