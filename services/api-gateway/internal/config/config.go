package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	AppEnv       string
	ServiceName  string
	PostgresURL  string
	RedisURL     string
}

func LoadConfig() *Config {
	err := godotenv.Load()

	if err != nil {
		log.Println(".env file not found")
	}

	return &Config{
		Port:        os.Getenv("PORT"),
		AppEnv:      os.Getenv("APP_ENV"),
		ServiceName: os.Getenv("SERVICE_NAME"),
		PostgresURL: os.Getenv("POSTGRES_URL"),
		RedisURL:    os.Getenv("REDIS_URL"),
	}
}