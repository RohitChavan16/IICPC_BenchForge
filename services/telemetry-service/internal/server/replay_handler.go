package server

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/gorilla/mux"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/database"
)

func HandleGetReplay(db *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		benchmarkID := vars["id"]

		replay, err := database.GetReplay(db, benchmarkID)
		if err != nil {
			http.Error(w, "Replay not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		
		// If status is not READY or FAILED, we construct a partial response
		if replay.Status == "PENDING" || replay.Status == "PROCESSING" {
			json.NewEncoder(w).Encode(map[string]string{
				"benchmark_id": benchmarkID,
				"status":       replay.Status,
			})
			return
		}

		w.Write(replay.ReplayData)
	}
}
