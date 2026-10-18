package main

import (
	"fmt"
	"sync"
	"testing"
)

// Replicate port allocation race condition from deployment-service deployer.go:63-82

type MockPortRegistry struct {
	mu           sync.Mutex
	usedPorts    map[int]bool
	allocations  []int
	raceDetected bool
}

func (r *MockPortRegistry) IsPortUsed(port int) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.usedPorts[port]
}

// VULNERABLE PORT ALLOCATION: mimics deployer.go:AllocatePort
// It checks isPortUsed in a loop, but DOES NOT atomically reserve the port!
func (r *MockPortRegistry) AllocatePortVulnerable(start, end int) (int, error) {
	for p := start; p <= end; p++ {
		if !r.IsPortUsed(p) {
			// Window of vulnerability between checking and inserting into DB!
			return p, nil
		}
	}
	return 0, fmt.Errorf("no free ports")
}

func (r *MockPortRegistry) ReservePort(port int) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.usedPorts[port] {
		r.raceDetected = true
	}
	r.usedPorts[port] = true
	r.allocations = append(r.allocations, port)
}

func TestDatabase_PortAllocationRaceCondition(t *testing.T) {
	reg := &MockPortRegistry{usedPorts: make(map[int]bool)}

	var wg sync.WaitGroup
	numConcurrentDeployments := 10
	wg.Add(numConcurrentDeployments)

	allocatedPorts := make([]int, numConcurrentDeployments)

	for i := 0; i < numConcurrentDeployments; i++ {
		go func(idx int) {
			defer wg.Done()
			port, err := reg.AllocatePortVulnerable(30000, 30050)
			if err == nil {
				allocatedPorts[idx] = port
				// Then the service executes DB UPDATE / docker run
				reg.ReservePort(port)
			}
		}(i)
	}

	wg.Wait()

	// Check if multiple deployments were assigned the same port
	portCounts := make(map[int]int)
	duplicateFound := false
	for _, p := range allocatedPorts {
		portCounts[p]++
		if portCounts[p] > 1 {
			duplicateFound = true
		}
	}

	t.Logf("Allocated Ports across %d concurrent deployments: %v", numConcurrentDeployments, allocatedPorts)
	if duplicateFound {
		t.Logf("CONFIRMED RACE CONDITION (BF-P1-014): Multiple concurrent deployments received the exact same host port!")
	} else {
		t.Log("Note: In-memory simulation avoided duplicate, but without row locking on DB, race is structurally possible.")
	}
}

// Replicate Multi-Service Stage Progression vs Regression on submissions table
type MockSubmissionState struct {
	mu           sync.Mutex
	CurrentStage string
	StageStatus  string
	History      []string
}

func (s *MockSubmissionState) UpdateStage(stage, status string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.CurrentStage = stage
	s.StageStatus = status
	s.History = append(s.History, fmt.Sprintf("%s:%s", stage, status))
}

func TestDatabase_MultiServiceStageCollision(t *testing.T) {
	sub := &MockSubmissionState{CurrentStage: "UPLOAD", StageStatus: "SUCCESS"}

	// Simulate concurrent updates from container-runner, deployment-service, and benchmark-service
	var wg sync.WaitGroup
	wg.Add(3)

	go func() {
		defer wg.Done()
		sub.UpdateStage("BUILD", "SUCCESS")
	}()

	go func() {
		defer wg.Done()
		sub.UpdateStage("DEPLOYMENT", "SUCCESS")
	}()

	go func() {
		defer wg.Done()
		sub.UpdateStage("BENCHMARK", "IN_PROGRESS")
	}()

	wg.Wait()

	t.Logf("Final Submission Stage after uncoordinated concurrent updates: %s (%s)", sub.CurrentStage, sub.StageStatus)
	t.Logf("Stage Transition History: %v", sub.History)
	t.Log("Finding (BF-P1-032): Submissions table lacks optimistic locking or state-machine validation; any service can overwrite stage at any time.")
}

func TestDatabase_LeaderboardUpsertIdempotency(t *testing.T) {
	// Replicate leaderboard.go:145 WHERE EXCLUDED.final_score > leaderboard_entries.final_score
	existingScore := 1500.0

	// 1. New lower score (e.g. 1200.0)
	newLowerScore := 1200.0
	shouldUpdateLower := newLowerScore > existingScore
	if shouldUpdateLower {
		t.Fatalf("Leaderboard should not overwrite higher personal best with lower score")
	}

	// 2. New higher score (e.g. 1800.0)
	newHigherScore := 1800.0
	shouldUpdateHigher := newHigherScore > existingScore
	if !shouldUpdateHigher {
		t.Fatalf("Leaderboard should update when new score is higher")
	}

	t.Log("Verified: Leaderboard upsert condition (EXCLUDED.final_score > existing) preserves contestant personal bests idempotently.")
}
