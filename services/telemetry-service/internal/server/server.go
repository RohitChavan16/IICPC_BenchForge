package server

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"strings"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/gorilla/websocket"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/aggregator"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/database"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/dlq"
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
	db *pgxpool.Pool,
	rdb *redis.Client,
) {

	// Start the Hub
	go hub.Run()

	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	http.HandleFunc("/ticket", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		benchmarkID := r.URL.Query().Get("benchmarkId")
		if benchmarkID == "" {
			http.Error(w, "missing benchmarkId", http.StatusBadRequest)
			return
		}

		// Verify user has access to benchmark
		userID := r.Header.Get("X-User-Id")
		if userID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		var ownerID string
		if benchmarkID != "GLOBAL" {
			err := db.QueryRow(context.Background(), "SELECT user_id FROM benchmarks WHERE id = $1", benchmarkID).Scan(&ownerID)
			if err != nil {
				http.Error(w, "benchmark not found", http.StatusNotFound)
				return
			}
		}

		// Simple access control: owner or let's assume team members could access in the future.
		// For now, check if user is owner or if they have an admin role (mocked).
		userRole := r.Header.Get("X-User-Role")
		if benchmarkID == "GLOBAL" && userRole != "admin" {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		} else if benchmarkID != "GLOBAL" && ownerID != userID && userRole != "admin" {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}

		// Generate ticket
		ticketID := uuid.New().String()
		ticketKey := "ws_ticket:" + ticketID
		
		ticketData, _ := json.Marshal(map[string]string{
			"user_id":      userID,
			"benchmark_id": benchmarkID,
		})

		err := rdb.Set(context.Background(), ticketKey, ticketData, 60*time.Second).Err()
		if err != nil {
			http.Error(w, "failed to generate ticket", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"ticket": ticketID,
		})
	})

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		benchmarkID := r.URL.Query().Get("benchmarkId")
		ticketID := r.URL.Query().Get("ticket")

		if benchmarkID == "" || ticketID == "" {
			http.Error(w, "missing benchmarkId or ticket", http.StatusBadRequest)
			return
		}

		ticketKey := "ws_ticket:" + ticketID
		val, err := rdb.Get(context.Background(), ticketKey).Result()
		if err != nil {
			http.Error(w, "invalid or expired ticket", http.StatusForbidden)
			return
		}

		// Delete ticket so it can only be used once
		rdb.Del(context.Background(), ticketKey)

		var ticketData map[string]string
		json.Unmarshal([]byte(val), &ticketData)

		if ticketData["benchmark_id"] != benchmarkID {
			http.Error(w, "ticket does not match benchmark", http.StatusForbidden)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("upgrade error:", err)
			return
		}

		client := &ws.Client{
			Hub:          hub,
			Conn:         conn,
			Send:         make(chan []byte, 256),
			ConnectionID: uuid.New().String(),
			BenchmarkID:  benchmarkID,
		}

		client.Hub.Register <- client

		// Start pumps
		go client.WritePump()
		go client.ReadPump()
	})

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

	http.HandleFunc(
		"/history",
		func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}
			benchmarkID := r.URL.Query().Get("benchmarkId")
			if benchmarkID == "" {
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			// Calculate duration first
			durationQuery := `SELECT COALESCE(EXTRACT(EPOCH FROM (max(created_at) - min(created_at))), 0) FROM telemetry_metrics WHERE benchmark_id = $1`
			var duration float64
			err := db.QueryRow(context.Background(), durationQuery, benchmarkID).Scan(&duration)
			if err != nil {
				log.Printf("failed to get duration: %v", err)
			}

			timeUnit := "minute"
			if duration <= 300 {
				timeUnit = "second"
			}

			// simple aggregation grouped by timeUnit
			query := `
			SELECT 
				date_trunc($2, created_at) AS time,
				count(*) AS total,
				sum(case when success then 1 else 0 end) AS success_count,
				avg(latency) AS avg_latency
			FROM telemetry_metrics
			WHERE benchmark_id = $1
			GROUP BY 1
			ORDER BY 1 ASC
			`
			rows, err := db.Query(context.Background(), query, benchmarkID, timeUnit)
			if err != nil {
				log.Printf("history error: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			defer rows.Close()

			type HistoryData struct {
				Time         string  `json:"timestamp"`
				TPS          float64 `json:"tps"`
				SuccessRate  float64 `json:"success_rate"`
				Latency      float64 `json:"p50"`
			}
			var results []HistoryData
			for rows.Next() {
				var t time.Time
				var total, successCount int64
				var avgLatency float64
				if err := rows.Scan(&t, &total, &successCount, &avgLatency); err != nil {
					continue
				}
				var tps float64
				if timeUnit == "second" {
					tps = float64(total)
				} else {
					tps = float64(total) / 60.0
				}
				results = append(results, HistoryData{
					Time:        t.UTC().Format(time.RFC3339),
					TPS:         tps,
					SuccessRate: (float64(successCount) / float64(total)) * 100.0,
					Latency:     avgLatency,
				})
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(results)
		},
	)

	http.HandleFunc(
		"/personas",
		func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}
			benchmarkID := r.URL.Query().Get("benchmarkId")
			if benchmarkID == "" {
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			// Calculate duration first
			durationQuery := `SELECT COALESCE(EXTRACT(EPOCH FROM (max(created_at) - min(created_at))), 0) FROM telemetry_metrics WHERE benchmark_id = $1`
			var duration float64
			db.QueryRow(context.Background(), durationQuery, benchmarkID).Scan(&duration)
			if duration <= 0 {
				duration = 1
			}

			query := `
			SELECT 
				bot_type,
				count(*) AS total,
				sum(case when success then 1 else 0 end) AS success_count,
				percentile_cont(0.99) within group (order by latency) AS p99_latency
			FROM telemetry_metrics
			WHERE benchmark_id = $1
			GROUP BY bot_type
			`
			rows, err := db.Query(context.Background(), query, benchmarkID)
			if err != nil {
				log.Printf("personas error: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			defer rows.Close()

			type PersonaData struct {
				BotType     string  `json:"botType"`
				Total       int64   `json:"total"`
				SuccessRate float64 `json:"successRate"`
				Latency     float64 `json:"latency"`
				TPS         float64 `json:"tps"`
			}
			var results []PersonaData
			for rows.Next() {
				var botType string
				var total, successCount int64
				var p99Latency float64
				if err := rows.Scan(&botType, &total, &successCount, &p99Latency); err != nil {
					continue
				}
				results = append(results, PersonaData{
					BotType:     botType,
					Total:       total,
					SuccessRate: (float64(successCount) / float64(total)) * 100.0,
					Latency:     p99Latency,
					TPS:         float64(total) / duration,
				})
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(results)
		},
	)

	http.HandleFunc(
		"/personas/batch",
		func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}
			benchmarkIdsStr := r.URL.Query().Get("benchmarkIds")
			if benchmarkIdsStr == "" {
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			benchmarkIDs := strings.Split(benchmarkIdsStr, ",")

			type PersonaData struct {
				BenchmarkID string  `json:"benchmarkId"`
				BotType     string  `json:"botType"`
				Total       int64   `json:"total"`
				SuccessRate float64 `json:"successRate"`
				Latency     float64 `json:"latency"`
				TPS         float64 `json:"tps"`
			}
			var results []PersonaData

			// Calculate durations per benchmark
			durationQuery := `
			SELECT benchmark_id, COALESCE(EXTRACT(EPOCH FROM (max(created_at) - min(created_at))), 0) 
			FROM telemetry_metrics 
			WHERE benchmark_id = ANY($1) 
			GROUP BY benchmark_id`
			
			durationRows, err := db.Query(context.Background(), durationQuery, benchmarkIDs)
			if err != nil {
				log.Printf("personas batch duration error: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			durations := make(map[string]float64)
			for durationRows.Next() {
				var bid string
				var d float64
				if err := durationRows.Scan(&bid, &d); err == nil {
					if d <= 0 {
						d = 1
					}
					durations[bid] = d
				}
			}
			durationRows.Close()

			query := `
			SELECT 
				benchmark_id,
				bot_type,
				count(*) AS total,
				sum(case when success then 1 else 0 end) AS success_count,
				percentile_cont(0.99) within group (order by latency) AS p99_latency
			FROM telemetry_metrics
			WHERE benchmark_id = ANY($1)
			GROUP BY benchmark_id, bot_type
			`
			rows, err := db.Query(context.Background(), query, benchmarkIDs)
			if err != nil {
				log.Printf("personas batch error: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			defer rows.Close()

			for rows.Next() {
				var bid, botType string
				var total, successCount int64
				var p99Latency float64
				if err := rows.Scan(&bid, &botType, &total, &successCount, &p99Latency); err != nil {
					continue
				}
				
				d := durations[bid]
				if d <= 0 {
					d = 1
				}

				results = append(results, PersonaData{
					BenchmarkID: bid,
					BotType:     botType,
					Total:       total,
					SuccessRate: (float64(successCount) / float64(total)) * 100.0,
					Latency:     p99Latency,
					TPS:         float64(total) / d,
				})
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(results)
		},
	)

	http.HandleFunc(
		"/replay",
		func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}
			benchmarkID := r.URL.Query().Get("benchmarkId")
			if benchmarkID == "" {
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			replay, err := database.GetReplay(db, benchmarkID)
			if err != nil {
				http.Error(w, "Replay not found", http.StatusNotFound)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			
			if replay.Status == "PENDING" || replay.Status == "PROCESSING" {
				json.NewEncoder(w).Encode(map[string]string{
					"benchmark_id": benchmarkID,
					"status":       replay.Status,
				})
				return
			}
			w.Write(replay.ReplayData)
		},
	)

	http.HandleFunc(
		"/api/dlq",
		func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodGet {
				dlq.ListHandler(rdb)(w, r)
			} else {
				w.WriteHeader(http.StatusMethodNotAllowed)
			}
		},
	)

	http.HandleFunc(
		"/api/dlq/",
		func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodPost {
				dlq.ReplayHandler(rdb)(w, r)
			} else if r.Method == http.MethodDelete {
				dlq.DiscardHandler(rdb)(w, r)
			} else {
				w.WriteHeader(http.StatusMethodNotAllowed)
			}
		},
	)

	http.HandleFunc(
		"/infrastructure/redis",
		func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}
			info, err := rdb.Info(context.Background()).Result()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			
			metrics := make(map[string]string)
			for _, line := range strings.Split(info, "\n") {
				line = strings.TrimSpace(line)
				if line == "" || strings.HasPrefix(line, "#") {
					continue
				}
				parts := strings.SplitN(line, ":", 2)
				if len(parts) == 2 {
					metrics[parts[0]] = parts[1]
				}
			}

			type Metric struct {
				Name  string `json:"name"`
				Value string `json:"value"`
				Unit  string `json:"unit"`
				Delta string `json:"delta"`
			}
			var results []Metric
			results = append(results, Metric{Name: "redis_connected_clients", Value: metrics["connected_clients"], Unit: "clients", Delta: "n/a"})
			results = append(results, Metric{Name: "redis_memory_used_bytes", Value: metrics["used_memory"], Unit: "bytes", Delta: "n/a"})
			results = append(results, Metric{Name: "redis_commands_per_sec", Value: metrics["instantaneous_ops_per_sec"], Unit: "ops/s", Delta: "n/a"})
			results = append(results, Metric{Name: "redis_exporter_up", Value: "1", Unit: "state", Delta: "n/a"})
			
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(results)
		},
	)

	http.HandleFunc(
		"/infrastructure/postgres",
		func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}
			
			var activeConnections string
			err := db.QueryRow(context.Background(), "SELECT count(*) FROM pg_stat_activity").Scan(&activeConnections)
			if err != nil { activeConnections = "0" }

			var dbSize string
			err = db.QueryRow(context.Background(), "SELECT pg_database_size(current_database())").Scan(&dbSize)
			if err != nil { dbSize = "0" }

			var locks string
			err = db.QueryRow(context.Background(), "SELECT count(*) FROM pg_locks").Scan(&locks)
			if err != nil { locks = "0" }

			type Metric struct {
				Name  string `json:"name"`
				Value string `json:"value"`
				Unit  string `json:"unit"`
				Delta string `json:"delta"`
			}
			var results []Metric
			results = append(results, Metric{Name: "pg_stat_activity_count", Value: activeConnections, Unit: "connections", Delta: "n/a"})
			results = append(results, Metric{Name: "pg_database_size_bytes", Value: dbSize, Unit: "bytes", Delta: "n/a"})
			results = append(results, Metric{Name: "pg_locks", Value: locks, Unit: "locks", Delta: "n/a"})
			results = append(results, Metric{Name: "postgres_exporter_up", Value: "1", Unit: "state", Delta: "n/a"})

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(results)
		},
	)

	http.HandleFunc(
		"/infrastructure/summary",
		func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}
			
			var activeConnections string
			db.QueryRow(context.Background(), "SELECT count(*) FROM pg_stat_activity").Scan(&activeConnections)
			
			info, _ := rdb.Info(context.Background()).Result()
			connectedClients := "0"
			for _, line := range strings.Split(info, "\n") {
				line = strings.TrimSpace(line)
				if strings.HasPrefix(line, "connected_clients:") {
					connectedClients = strings.TrimPrefix(line, "connected_clients:")
					break
				}
			}

			type InfraMetric struct {
				Label  string `json:"label"`
				Value  string `json:"value"`
				Change string `json:"change"`
				Trend  string `json:"trend"`
				Detail string `json:"detail"`
			}
			var results []InfraMetric
			results = append(results, InfraMetric{Label: "Postgres: active connections", Value: activeConnections, Change: "-", Trend: "flat", Detail: "connections"})
			results = append(results, InfraMetric{Label: "Redis: connected clients", Value: connectedClients, Change: "-", Trend: "flat", Detail: "clients"})
			results = append(results, InfraMetric{Label: "Containers: CPU cores", Value: "0", Change: "-", Trend: "flat", Detail: "cores (unavailable)"})

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(results)
		},
	)

	http.HandleFunc(
		"/infrastructure/health",
		func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}
			
			type HealthStatus struct {
				Label   string `json:"label"`
				Status  string `json:"status"`
				Details string `json:"details"`
			}
			var results []HealthStatus
			
			dbStatus := "Healthy"
			dbDetails := "Reachable"
			if err := db.Ping(context.Background()); err != nil {
				dbStatus = "Warning"
				dbDetails = err.Error()
			}
			results = append(results, HealthStatus{Label: "postgres", Status: dbStatus, Details: dbDetails})

			redisStatus := "Healthy"
			redisDetails := "Reachable"
			if err := rdb.Ping(context.Background()).Err(); err != nil {
				redisStatus = "Warning"
				redisDetails = err.Error()
			}
			results = append(results, HealthStatus{Label: "redis", Status: redisStatus, Details: redisDetails})
			results = append(results, HealthStatus{Label: "telemetry-service", Status: "Healthy", Details: "Self"})
			
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(results)
		},
	)

	http.Handle("/metrics", promhttp.Handler())

	log.Println("Telemetry Service Running :8081")

	http.ListenAndServe(":8081", nil)
}