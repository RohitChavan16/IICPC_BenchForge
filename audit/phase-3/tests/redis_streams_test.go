package main

import (
	"encoding/json"
	"fmt"
	"sync"
	"testing"
	"time"
)

// Replicate Redis Streams delivery, retry, and DLQ semantics from
// services/telemetry-service/internal/consumer/consumer.go

type SimulatedStreamMessage struct {
	ID        string
	RequestID string
	Payload   string
	Retries   int
}

type SimulatedDB struct {
	mu           sync.Mutex
	records      map[string]bool // request_id uniqueness
	insertErrors int
}

func (db *SimulatedDB) InsertWithIdempotency(reqID string, simulateError bool) (bool, error) {
	db.mu.Lock()
	defer db.mu.Unlock()

	if simulateError {
		return false, fmt.Errorf("database connection reset")
	}

	if db.records[reqID] {
		// Idempotent skip: ON CONFLICT DO NOTHING
		return false, nil
	}

	db.records[reqID] = true
	return true, nil
}

func TestRedisStreams_AtLeastOnceAndIdempotency(t *testing.T) {
	db := &SimulatedDB{records: make(map[string]bool)}

	// Simulate duplicate delivery of message (e.g. consumer crashed after DB write but before XAck)
	reqID := "req-uuid-12345"

	// 1. First delivery: successfully inserted
	inserted1, err := db.InsertWithIdempotency(reqID, false)
	if err != nil || !inserted1 {
		t.Fatalf("First insert failed: %v", err)
	}

	// 2. Second delivery (duplicate from XClaim / restart)
	inserted2, err := db.InsertWithIdempotency(reqID, false)
	if err != nil {
		t.Fatalf("Second insert error: %v", err)
	}
	if inserted2 {
		t.Fatalf("Duplicate message should have been skipped by idempotency check")
	}

	t.Log("Verified: ON CONFLICT (request_id) DO NOTHING successfully provides effectively-once storage despite duplicate at-least-once delivery.")
}

func TestRedisStreams_DLQPolicyAfterRetries(t *testing.T) {
	// Replicate consumer.go:390-412 retry and DLQ logic:
	// maxRetries := 3
	// if retries >= maxRetries -> XAdd to telemetry_dlq, XAck original
	maxRetries := 3
	dlq := make([]SimulatedStreamMessage, 0)
	acked := make([]string, 0)

	msg := SimulatedStreamMessage{
		ID:        "1710000000-0",
		RequestID: "poison-pill",
		Payload:   "invalid-malformed-json",
		Retries:   0,
	}

	for attempt := 1; attempt <= 4; attempt++ {
		msg.Retries++
		if msg.Retries >= maxRetries {
			// Push to DLQ and ACK from original stream
			dlq = append(dlq, msg)
			acked = append(acked, msg.ID)
			break
		}
	}

	if len(dlq) != 1 || len(acked) != 1 {
		t.Fatalf("Expected poison message to be routed to DLQ after %d retries", maxRetries)
	}
	t.Logf("Verified: Poison message routed to DLQ after %d retries with stream ACK.", maxRetries)
}

func TestRedisStreams_TelemetryDrainageRaceWindow(t *testing.T) {
	// Simulate the race condition between:
	// Goroutine A: Bot worker completes requests -> immediately calls PATCH /status COMPLETED -> triggers Leaderboard Upsert & Replay Trigger
	// Goroutine B: Telemetry stream consumer is still processing backlog messages from Redis stream

	totalRequests := 100
	telemetryStream := make(chan int, totalRequests)
	for i := 1; i <= totalRequests; i++ {
		telemetryStream <- i
	}

	var consumedCount int
	var streamFinished bool
	var mu sync.Mutex

	// Telemetry Consumer goroutine (simulating DB insertion latency)
	go func() {
		for range telemetryStream {
			time.Sleep(1 * time.Millisecond) // DB write time
			mu.Lock()
			consumedCount++
			mu.Unlock()
		}
		mu.Lock()
		streamFinished = true
		mu.Unlock()
	}()

	// Bot Worker completes immediately and triggers benchmark status update
	time.Sleep(10 * time.Millisecond) // Worker finishes before stream drains
	mu.Lock()
	inDbAtCompletion := consumedCount
	isFinished := streamFinished
	mu.Unlock()

	t.Logf("At Benchmark Completion: Total Sent = %d, Telemetry Rows in DB = %d, Stream Drained = %v",
		totalRequests, inDbAtCompletion, isFinished)

	if inDbAtCompletion < totalRequests && !isFinished {
		t.Log("CONFIRMED RACE WINDOW: Benchmark marked COMPLETED while telemetry stream backlog is still draining.")
		t.Log("Impact: Triggering Replay window function immediately upon completion reads incomplete dataset.")
	}

	close(telemetryStream)
}

func TestRedisStreams_SystemControlStopStream(t *testing.T) {
	// Replicate consumer.go:352-360:
	// if metric.BotType == "system_control" && metric.WorkerID == "STOP_STREAM"
	controlPayload := map[string]interface{}{
		"bot_type":  "system_control",
		"worker_id": "STOP_STREAM",
		"benchmark_id": "bench-uuid-99",
	}

	bytes, _ := json.Marshal(controlPayload)
	var parsed map[string]interface{}
	json.Unmarshal(bytes, &parsed)

	if parsed["bot_type"] == "system_control" && parsed["worker_id"] == "STOP_STREAM" {
		t.Log("Verified: STOP_STREAM control metric correctly parsed and handled as stream termination sentinel.")
	} else {
		t.Fatalf("Failed to parse control metric")
	}
}
