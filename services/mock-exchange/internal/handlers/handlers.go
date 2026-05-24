package handlers

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"time"
)

type Order struct {
	Symbol   string  `json:"symbol"`
	Price    float64 `json:"price"`
	Quantity int     `json:"quantity"`
	Side     string  `json:"side"`
}

func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func OrderHandler(w http.ResponseWriter, r *http.Request) {
	var order Order

	json.NewDecoder(r.Body).Decode(&order)

	// Simulate exchange latency
	delay := rand.Intn(20)

	time.Sleep(time.Duration(delay) * time.Millisecond)

	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "accepted",
		"latency": delay,
	})
}

func CancelHandler(w http.ResponseWriter, r *http.Request) {
	time.Sleep(5 * time.Millisecond)

	w.WriteHeader(http.StatusOK)

	w.Write([]byte("cancelled"))
}