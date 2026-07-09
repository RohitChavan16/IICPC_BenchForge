package ratelimit

import (
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type clientLimiter struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type Manager struct {
	mu       sync.Mutex
	clients  map[string]*clientLimiter
	rate     rate.Limit
	burst    int
	window   time.Duration
	requests int
}

func NewManager(requests int, window time.Duration, burst int) *Manager {
	var r rate.Limit
	if window == 0 || requests == 0 {
		r = rate.Inf
	} else {
		r = rate.Every(window / time.Duration(requests))
	}
	
	m := &Manager{
		clients:  make(map[string]*clientLimiter),
		rate:     r,
		burst:    burst,
		window:   window,
		requests: requests,
	}
	
	// Start cleanup routine
	go m.cleanupLoop()
	return m
}

func (m *Manager) GetLimiter(clientID string) *rate.Limiter {
	m.mu.Lock()
	defer m.mu.Unlock()

	cl, exists := m.clients[clientID]
	if !exists {
		limiter := rate.NewLimiter(m.rate, m.burst)
		m.clients[clientID] = &clientLimiter{
			limiter:  limiter,
			lastSeen: time.Now(),
		}
		return limiter
	}

	cl.lastSeen = time.Now()
	return cl.limiter
}

func (m *Manager) GetLimit() int {
	return m.requests
}

func (m *Manager) cleanupLoop() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for {
		<-ticker.C
		m.mu.Lock()
		for id, cl := range m.clients {
			// Remove if inactive for 3 times the window or 5 minutes minimum
			timeout := m.window * 3
			if timeout < 5*time.Minute {
				timeout = 5 * time.Minute
			}
			if time.Since(cl.lastSeen) > timeout {
				delete(m.clients, id)
			}
		}
		m.mu.Unlock()
	}
}
