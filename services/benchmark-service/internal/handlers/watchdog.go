package handlers

import (
	"log"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/repository"
)

func (h *BenchmarkHandler) StartWatchdog() {
	ticker := time.NewTicker(30 * time.Second)
	go func() {
		for range ticker.C {
			h.checkAbandonedBenchmarks()
		}
	}()
}

func (h *BenchmarkHandler) checkAbandonedBenchmarks() {
	// We want to fail benchmarks that are RUNNING and have either:
	// 1. last_heartbeat is older than 60 seconds.
	// 2. Or, if last_heartbeat is null, started_at is older than the dynamic timeout.
	// Dynamic timeout: max(300, (total_requests / GREATEST(worker_count, 1)) * 5)

	query := `
		SELECT id, submission_id, name FROM benchmarks
		WHERE status = 'RUNNING'
		AND (
			(last_heartbeat IS NOT NULL AND EXTRACT(EPOCH FROM (now() - last_heartbeat)) > 60)
			OR
			(last_heartbeat IS NULL AND EXTRACT(EPOCH FROM (now() - started_at)) > GREATEST(300, (total_requests / GREATEST(worker_count, 1)) * 5))
		)
	`
	rows, err := h.db.Query(query)
	if err != nil {
		log.Printf("watchdog query error: %v", err)
		return
	}
	defer rows.Close()

	var abandoned []struct{ ID, SubID, Name string }
	for rows.Next() {
		var id, subID, name string
		var dbSubID *string
		if err := rows.Scan(&id, &dbSubID, &name); err != nil {
			log.Printf("watchdog scan error: %v", err)
			continue
		}
		if dbSubID != nil {
			subID = *dbSubID
		}
		abandoned = append(abandoned, struct{ ID, SubID, Name string }{id, subID, name})
	}
	rows.Close()

	for _, b := range abandoned {
		log.Printf("Watchdog detected abandoned benchmark %s (%s)", b.Name, b.ID)
		failureReason := "Execution timed out or bot-worker crashed (missed heartbeat)"
		
		_, err := repository.UpdateBenchmarkStatus(h.db, b.ID, "FAILED", 0, 0, 0, 0, 0, 0, 0, 0, failureReason)
		if err != nil {
			log.Printf("watchdog failed to update benchmark status: %v", err)
			continue
		}

		if b.SubID != "" {
			h.publishLog(b.SubID, "BENCHMARK", "log", "Watchdog: "+failureReason, "FAILED")
			h.setStage(b.SubID, "BENCHMARK", "FAILED", failureReason)
		}

		// Trigger queue to unblock the next benchmark
		go h.ProcessQueue()
	}
}
