package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                string
	DatabaseURL         string
	RedisURL            string
	WorkerSecret        string
	BenchmarkServiceURL string
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

	return &Config{
		Port:                getEnvOrDefault("PORT", "8081"),
		DatabaseURL:         getEnvOrFatal("DATABASE_URL"),
		RedisURL:            getEnvOrFatal("REDIS_URL"),
		WorkerSecret:        getEnvOrFatal("WORKER_SECRET"),
		BenchmarkServiceURL: getEnvOrFatal("BENCHMARK_SERVICE_URL"),
	}
}
