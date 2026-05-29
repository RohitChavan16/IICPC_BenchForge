package server

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/aggregator"
	ws "github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/websocket"
)

type WorkerStatus struct {
	WorkerID    string  `json:"workerId"`
	Status      string  `json:"status"` // active, idle, offline
	LastSeen    string  `json:"lastSeen"`
	TPS         float64 `json:"tps"`
	P50         float64 `json:"p50"`
	P90         float64 `json:"p90"`
	P99         float64 `json:"p99"`
	FailureRate float64 `json:"failureRate"`
	Total       int     `json:"total"`
}

func getWorkersHandler(
	workerAggs map[string]*aggregator.Aggregator,
	workerLastSeen map[string]time.Time,
	workerMu *sync.Mutex,
	w http.ResponseWriter,
	r *http.Request,
) {
	// status thresholds
	activeThreshold := 5 * time.Second
	idleThreshold := 60 * time.Second

	now := time.Now()

	// copy worker state under lock
	workerMu.Lock()
	var results []WorkerStatus
	for workerID, wa := range workerAggs {
		lastSeen := workerLastSeen[workerID]

		// determine status
		var status string
		if now.Sub(lastSeen) <= activeThreshold {
			status = "active"
		} else if now.Sub(lastSeen) <= idleThreshold {
			status = "idle"
		} else {
			status = "offline"
		}

		// get snapshot
		snapshot := wa.Snapshot()

		results = append(results, WorkerStatus{
			WorkerID:    workerID,
			Status:      status,
			LastSeen:    lastSeen.UTC().Format(time.RFC3339),
			TPS:         snapshot.TPS,
			P50:         snapshot.P50,
			P90:         snapshot.P90,
			P99:         snapshot.P99,
			FailureRate: snapshot.FailureRate,
			Total:       snapshot.Total,
		})
	}
	workerMu.Unlock()

	// return JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(results)
}

func StartServer(
	hub *ws.Hub,
	workerAggs map[string]*aggregator.Aggregator,
	workerLastSeen map[string]time.Time,
	workerMu *sync.Mutex,
) {

	http.HandleFunc(
		"/ws",
		hub.HandleConnections,
	)

	http.HandleFunc(
		"/workers",
		func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}
			getWorkersHandler(workerAggs, workerLastSeen, workerMu, w, r)
		},
	)

	log.Println("Telemetry Service Running :8081")

	http.ListenAndServe(":8081", nil)
}