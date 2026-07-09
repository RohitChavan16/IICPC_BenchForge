package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                string
	DatabaseURL         string
	RedisURL            string
	BenchmarkServiceURL string
	DeployPortStart     int
	DeployPortEnd       int
	DeployNetwork       string
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

	ps := 30000
	if v := os.Getenv("DEPLOY_PORT_START"); v != "" {
		if n, err := strconv.Atoi(v); err == nil { ps = n }
	}
	pe := 31000
	if v := os.Getenv("DEPLOY_PORT_END"); v != "" {
		if n, err := strconv.Atoi(v); err == nil { pe = n }
	}

	return &Config{
		Port:                getEnvOrDefault("PORT", "8091"),
		DatabaseURL:         getEnvOrFatal("DATABASE_URL"),
		RedisURL:            getEnvOrFatal("REDIS_URL"),
		BenchmarkServiceURL: getEnvOrFatal("BENCHMARK_SERVICE_URL"),
		DeployPortStart:     ps,
		DeployPortEnd:       pe,
		DeployNetwork:       getEnvOrDefault("DEPLOY_NETWORK", "iicpc_benchforge_default"),
	}
}
