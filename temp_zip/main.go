package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
)

type Order struct {
	Symbol   string  `json:"symbol"`
	Price    float64 `json:"price"`
	Quantity int     `json:"quantity"`
	Side     string  `json:"side"`
}

type Engine struct {
	mu     sync.Mutex
	orders int
}

func (e *Engine) handleOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req Order
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	e.mu.Lock()
	e.orders++
	e.mu.Unlock()

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"accepted", "symbol":"%s"}`, req.Symbol)
}

func main() {
	engine := &Engine{}

	http.HandleFunc("/order", engine.handleOrder)
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"status":"ok"}`)
	})

	log.Println("Go Mock Engine listening on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
