package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/RohitChavan16/IICPC_BenchForge/services/leaderboard-service/internal/repository"
)

type LeaderboardHandler struct {
	db *sql.DB
}

func NewLeaderboardHandler(db *sql.DB) *LeaderboardHandler {
	return &LeaderboardHandler{db: db}
}

func (h *LeaderboardHandler) ListLeaderboard(w http.ResponseWriter, r *http.Request) {
	limit := 100
	entries, total, err := repository.ListLeaderboardEntries(h.db, limit, 0)
	if err != nil {
		log.Printf("list leaderboard error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	resp := map[string]interface{}{"items": entries, "total": total}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *LeaderboardHandler) ListTopLeaderboard(w http.ResponseWriter, r *http.Request) {
	entries, err := repository.ListTopLeaderboardEntries(h.db, 10)
	if err != nil {
		log.Printf("list top leaderboard error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	resp := map[string]interface{}{"items": entries}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *LeaderboardHandler) ListLeaderboardByTeam(w http.ResponseWriter, r *http.Request) {
	team := mux.Vars(r)["team"]
	if team == "" {
		http.Error(w, "team is required", http.StatusBadRequest)
		return
	}

	entries, err := repository.ListLeaderboardEntriesByTeam(h.db, team)
	if err != nil {
		log.Printf("list leaderboard by team error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	resp := map[string]interface{}{"items": entries}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
