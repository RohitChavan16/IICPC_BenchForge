package main

import (
	"encoding/json"
	"net/http"
	"time"
)

type Order struct {
	Symbol   string  `json:"symbol"`
	Price    float64 `json:"price"`
	Quantity int     `json:"quantity"`
	Side     string  `json:"side"`
}

func health(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func order(w http.ResponseWriter, r *http.Request) {
	var o Order
	json.NewDecoder(r.Body).Decode(&o)

	time.Sleep(50 * time.Millisecond)

	w.WriteHeader(http.StatusOK)
}

func main() {
	http.HandleFunc("/health", health)
	http.HandleFunc("/order", order)

	http.ListenAndServe(":8080", nil)
}