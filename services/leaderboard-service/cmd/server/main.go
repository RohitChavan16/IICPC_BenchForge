package main

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/leaderboard-service/internal/config"
	"github.com/RohitChavan16/IICPC_BenchForge/services/leaderboard-service/internal/repository"
	"github.com/RohitChavan16/IICPC_BenchForge/services/leaderboard-service/internal/server"
	_ "github.com/lib/pq"
)

func main() {
	cfg := config.LoadConfig()

	db, err := sql.Open("postgres", cfg.DatabaseURL)
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
		Addr:         ":" + cfg.Port,
		Handler:      server.NewServer(db),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Printf("Leaderboard service listening :%s", cfg.Port)
	log.Fatal(srv.ListenAndServe())
}
