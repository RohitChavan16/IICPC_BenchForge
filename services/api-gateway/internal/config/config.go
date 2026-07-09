package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                   string
	AppEnv                 string
	ServiceName            string
	PostgresURL            string
	RedisURL               string
	JWTSecret              string
	BenchmarkServiceURL    string
	TelemetryServiceURL    string
	LeaderboardServiceURL  string
	SubmissionServiceURL   string
	DeploymentServiceURL   string
	RateLimitEnabled       bool
	RateLimitRequests      int
	RateLimitWindow        time.Duration
	RateLimitBurst         int
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

func getEnvAsBool(key string, defaultVal bool) bool {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	b, err := strconv.ParseBool(val)
	if err != nil {
		return defaultVal
	}
	return b
}

func getEnvAsInt(key string, defaultVal int) int {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	i, err := strconv.Atoi(val)
	if err != nil {
		return defaultVal
	}
	return i
}

func getEnvAsDuration(key string, defaultVal time.Duration) time.Duration {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	d, err := time.ParseDuration(val)
	if err != nil {
		return defaultVal
	}
	return d
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("Note: .env file not found, relying on environment variables.")
	}

	return &Config{
		Port:                   getEnvOrDefault("PORT", "8080"),
		AppEnv:                 getEnvOrDefault("APP_ENV", "production"),
		ServiceName:            getEnvOrDefault("SERVICE_NAME", "api-gateway"),
		PostgresURL:            getEnvOrFatal("DATABASE_URL"),
		RedisURL:               getEnvOrFatal("REDIS_URL"),
		JWTSecret:              getEnvOrFatal("JWT_SECRET"),
		BenchmarkServiceURL:    getEnvOrFatal("BENCHMARK_SERVICE_URL"),
		TelemetryServiceURL:    getEnvOrFatal("TELEMETRY_SERVICE_URL"),
		LeaderboardServiceURL:  getEnvOrFatal("LEADERBOARD_SERVICE_URL"),
		SubmissionServiceURL:   getEnvOrFatal("SUBMISSION_SERVICE_URL"),
		DeploymentServiceURL:   getEnvOrFatal("DEPLOYMENT_SERVICE_URL"),
		RateLimitEnabled:       getEnvAsBool("RATE_LIMIT_ENABLED", true),
		RateLimitRequests:      getEnvAsInt("RATE_LIMIT_REQUESTS", 100),
		RateLimitWindow:        getEnvAsDuration("RATE_LIMIT_WINDOW", time.Minute),
		RateLimitBurst:         getEnvAsInt("RATE_LIMIT_BURST", 20),
	}
}
