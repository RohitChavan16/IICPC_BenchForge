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
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "internal server error", "status": http.StatusInternalServerError})
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
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "internal server error", "status": http.StatusInternalServerError})
		return
	}

	resp := map[string]interface{}{"items": entries}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *LeaderboardHandler) ListLeaderboardByTeam(w http.ResponseWriter, r *http.Request) {
	team := mux.Vars(r)["team"]
	if team == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "team is required", "status": http.StatusBadRequest})
		return
	}

	entries, err := repository.ListLeaderboardEntriesByTeam(h.db, team)
	if err != nil {
		log.Printf("list leaderboard by team error: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "internal server error", "status": http.StatusInternalServerError})
		return
	}

	resp := map[string]interface{}{"items": entries}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *LeaderboardHandler) GetLeaderboardByBenchmark(w http.ResponseWriter, r *http.Request) {
	benchmarkID := mux.Vars(r)["benchmarkId"]
	if benchmarkID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "benchmarkId is required", "status": http.StatusBadRequest})
		return
	}

	entry, err := repository.GetLeaderboardEntryForBenchmark(h.db, benchmarkID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.NotFound(w, r)
			return
		}
		log.Printf("get leaderboard by benchmark error: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "internal server error", "status": http.StatusInternalServerError})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entry)
}

func (h *LeaderboardHandler) GetLeaderboardContext(w http.ResponseWriter, r *http.Request) {
	team := r.URL.Query().Get("team")
	if team == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "team query parameter is required", "status": http.StatusBadRequest})
		return
	}

	entries, err := repository.GetLeaderboardContext(h.db, team)
	if err != nil {
		log.Printf("get leaderboard context error: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "internal server error", "status": http.StatusInternalServerError})
		return
	}

	resp := map[string]interface{}{"items": entries}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
