package server

import (
	"database/sql"

	"github.com/gorilla/mux"

	"github.com/RohitChavan16/IICPC_BenchForge/services/leaderboard-service/internal/handlers"
)

func NewServer(db *sql.DB) *mux.Router {
	r := mux.NewRouter()
	leaderboardHandler := handlers.NewLeaderboardHandler(db)

	r.HandleFunc("/leaderboard", leaderboardHandler.ListLeaderboard).Methods("GET")
	r.HandleFunc("/leaderboard/top", leaderboardHandler.ListTopLeaderboard).Methods("GET")
	r.HandleFunc("/leaderboard/team/{team}", leaderboardHandler.ListLeaderboardByTeam).Methods("GET")
	r.HandleFunc("/leaderboard/benchmark/{benchmarkId}", leaderboardHandler.GetLeaderboardByBenchmark).Methods("GET")

	return r
}
