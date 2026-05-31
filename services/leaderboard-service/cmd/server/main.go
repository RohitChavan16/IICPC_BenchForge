package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/leaderboard-service/internal/repository"
	"github.com/RohitChavan16/IICPC_BenchForge/services/leaderboard-service/internal/server"
	_ "github.com/lib/pq"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8084"
	}
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:password@postgres:5432/iicpc?sslmode=disable"
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("failed to open db: %v", err)
	}
	defer db.Close()

	if err := repository.EnsureLeaderboardTable(db); err != nil {
		log.Fatalf("failed to ensure leaderboard table: %v", err)
	}
	if err := repository.BackfillLeaderboardEntries(db); err != nil {
		log.Fatalf("failed to backfill leaderboard entries: %v", err)
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      server.NewServer(db),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Printf("Leaderboard service listening :%s", port)
	log.Fatal(srv.ListenAndServe())
}
