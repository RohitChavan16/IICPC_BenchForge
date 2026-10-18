package tests

import (
	"testing"
	"time"
)

// TestTelemetryDrainageBacklogModel demonstrates BF-P4-004:
// In telemetry-service/internal/consumer/consumer.go:373, every telemetry event
// executes an individual database.InsertMetric() call (db.Exec single row).
// Because each DB round-trip takes 0.5ms - 1.5ms, consumer capacity is hard-capped
// at ~800 - 1,500 events/sec. Any offered load higher than this causes severe queue backlog.
func TestTelemetryDrainageBacklogModel(t *testing.T) {
	testCases := []struct {
		name              string
		totalRequests     int
		offeredRatePerSec int
		consumerRatePerSec int
	}{
		{"LowLoad_1000TPS", 50_000, 1000, 1200},
		{"MediumLoad_5000TPS", 50_000, 5000, 1200},
		{"HighLoad_10000TPS", 50_000, 10000, 1200},
	}

	for _, tc := range testCases {
		// Calculate time bot-worker takes to send all requests
		sendDurationSec := float64(tc.totalRequests) / float64(tc.offeredRatePerSec)

		// Total messages processed by consumer during send window
		messagesProcessedDuringSend := int(float64(tc.consumerRatePerSec) * sendDurationSec)
		if messagesProcessedDuringSend > tc.totalRequests {
			messagesProcessedDuringSend = tc.totalRequests
		}

		// Backlog remaining in Redis Streams when bot-worker signals COMPLETED
		backlogAtCompletion := tc.totalRequests - messagesProcessedDuringSend

		// Additional drainage time required for consumer to finish writing to DB
		drainageTimeSec := float64(backlogAtCompletion) / float64(tc.consumerRatePerSec)

		t.Logf("[%s]", tc.name)
		t.Logf("  Total Requests: %d | Offered Load: %d req/s | DB Ingestion Capacity: %d ops/s",
			tc.totalRequests, tc.offeredRatePerSec, tc.consumerRatePerSec)
		t.Logf("  Send Duration: %.1fs | Backlog in Redis at Completion: %d events (%.1f%% of total)",
			sendDurationSec, backlogAtCompletion, float64(backlogAtCompletion)/float64(tc.totalRequests)*100.0)
		t.Logf("  Post-Run Drainage Lag: %.1fs (Stale metrics window)", drainageTimeSec)

		if tc.offeredRatePerSec > tc.consumerRatePerSec {
			if backlogAtCompletion == 0 {
				t.Errorf("[%s] Expected positive backlog when offered load exceeds DB capacity", tc.name)
			}
			if drainageTimeSec <= 0 {
				t.Errorf("[%s] Expected positive drainage lag", tc.name)
			}
		}
	}
}

// BenchmarkSingleRowInsertThroughput measures hypothetical single-row DB execution
// with a 0.5ms network round-trip delay.
func BenchmarkSingleRowInsertThroughput(b *testing.B) {
	// Simulated DB latency of 0.5ms per single-row Exec()
	simulatedDBLatency := 500 * time.Microsecond

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		time.Sleep(simulatedDBLatency)
	}
}
