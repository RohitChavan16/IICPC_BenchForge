package main

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
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

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      server.NewServer(db),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("Leaderboard service listening :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Printf("server crashed: %v", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	log.Println("Shutting down Leaderboard service gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	} else {
		log.Println("Leaderboard service stopped")
	}
}
