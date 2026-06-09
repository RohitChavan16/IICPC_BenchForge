package aggregator

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// StartReplayProcessorWorker runs in the background and polls for PENDING or PENDING_RETRY replays.
func StartReplayProcessorWorker(ctx context.Context, db *pgxpool.Pool) {
	log.Println("Starting ReplayProcessorWorker...")
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("Stopping ReplayProcessorWorker")
			return
		case <-ticker.C:
			processNextReplay(ctx, db)
		}
	}
}

func processNextReplay(ctx context.Context, db *pgxpool.Pool) {
	// Find one PENDING or PENDING_RETRY record and lock it
	query := `
		SELECT benchmark_id 
		FROM benchmark_replays 
		WHERE status IN ('PENDING', 'PENDING_RETRY')
		ORDER BY created_at ASC
		LIMIT 1 
		FOR UPDATE SKIP LOCKED
	`

	var benchmarkID string
	err := db.QueryRow(ctx, query).Scan(&benchmarkID)
	if err != nil {
		// No pending jobs or error
		return
	}

	// Assuming a real implementation would extract failure reasons from benchmark-service.
	// We'll pass nil here for simplicity, though the GenerateReplay function will check benchmark-service.
	var failReason *string
	
	// We run it synchronously so we don't pick up the same job twice
	// if it stays in PENDING state while processing (though GenerateReplay updates it to PROCESSING)
	GenerateReplay(db, benchmarkID, failReason)
}
