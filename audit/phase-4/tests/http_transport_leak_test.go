package tests

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/http/httptrace"
	"sync/atomic"
	"testing"
	"time"
)

// TestHTTPConnectionReuseFailure demonstrates BF-P4-003:
// In pool.go:158, `resp, err := bots.SendOrder(...)` is executed without closing
// or draining resp.Body. In Go net/http, an unclosed body prevents HTTP Keep-Alive
// connection reuse, forcing the client to dial new TCP sockets repeatedly.
func TestHTTPConnectionReuseFailure(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"status":"accepted"}`)
	}))
	defer ts.Close()

	// 1. Production pattern: unclosed resp.Body
	var dialsUnclosed int32
	clientUnclosed := &http.Client{
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 100,
		},
	}

	start1 := time.Now()
	for i := 0; i < 200; i++ {
		trace := &httptrace.ClientTrace{
			ConnectStart: func(network, addr string) {
				atomic.AddInt32(&dialsUnclosed, 1)
			},
		}
		req, _ := http.NewRequestWithContext(httptrace.WithClientTrace(context.Background(), trace), "POST", ts.URL, nil)
		resp, err := clientUnclosed.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		// PRODUCTION DEFECT: resp.Body.Close() is NOT called!
		_ = resp.StatusCode
	}
	durUnclosed := time.Since(start1)

	// 2. Correct pattern: drained and closed resp.Body
	var dialsClosed int32
	clientClosed := &http.Client{
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 100,
		},
	}

	start2 := time.Now()
	for i := 0; i < 200; i++ {
		trace := &httptrace.ClientTrace{
			ConnectStart: func(network, addr string) {
				atomic.AddInt32(&dialsClosed, 1)
			},
		}
		req, _ := http.NewRequestWithContext(httptrace.WithClientTrace(context.Background(), trace), "POST", ts.URL, nil)
		resp, err := clientClosed.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		io.Copy(io.Discard, resp.Body)
		resp.Body.Close() // Proper cleanup
	}
	durClosed := time.Since(start2)

	t.Logf("Unclosed Body (BenchForge): %d dials for 200 requests (Time: %s)", dialsUnclosed, durUnclosed)
	t.Logf("Closed Body (Standard):     %d dials for 200 requests (Time: %s)", dialsClosed, durClosed)

	if dialsUnclosed <= dialsClosed {
		t.Errorf("Expected unclosed body to cause significantly more TCP socket dials, got %d vs %d", dialsUnclosed, dialsClosed)
	}
}
