package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/server"
	_ "github.com/lib/pq"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:password@postgres:5432/iicpc?sslmode=disable"
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("failed to open db: %v", err)
	}
	defer db.Close()

	srv := &http.Server{
		Addr:         ":8082",
		Handler:      server.NewServer(db),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Println("Benchmark service listening :8082")
	log.Fatal(srv.ListenAndServe())
}
