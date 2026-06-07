package main

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

type Order struct {
	OrderID  string  `json:"order_id"`
	Symbol   string  `json:"symbol"`
	Side     string  `json:"side"`
	Price    float64 `json:"price"`
	Quantity int     `json:"quantity"`
}

type Trade struct {
	MakerOrderID string  `json:"maker_order_id"`
	Price        float64 `json:"price"`
	Quantity     int     `json:"quantity"`
}

type Response struct {
	Status           string  `json:"status"`
	ExecutedQuantity int     `json:"executed_quantity"`
	Trades           []Trade `json:"trades"`
}

var (
	book []Order
	mu   sync.Mutex
)

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"ok"}`))
}

func orderHandler(w http.ResponseWriter, r *http.Request) {

	var incoming Order

	if err := json.NewDecoder(r.Body).Decode(&incoming); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	trades := []Trade{}
	executed := 0
	remaining := incoming.Quantity

	newBook := make([]Order, 0)

	for _, resting := range book {

		if remaining == 0 {
			newBook = append(newBook, resting)
			continue
		}

		if incoming.Symbol != resting.Symbol {
			newBook = append(newBook, resting)
			continue
		}

		if incoming.Side == resting.Side {
			newBook = append(newBook, resting)
			continue
		}

		canMatch := false

		if incoming.Side == "buy" && incoming.Price >= resting.Price {
			canMatch = true
		}

		if incoming.Side == "sell" && incoming.Price <= resting.Price {
			canMatch = true
		}

		if !canMatch {
			newBook = append(newBook, resting)
			continue
		}

		matchQty := remaining

		if resting.Quantity < matchQty {
			matchQty = resting.Quantity
		}

		trades = append(trades, Trade{
			MakerOrderID: resting.OrderID,
			Price:        resting.Price, // price improvement
			Quantity:     matchQty,
		})

		executed += matchQty
		remaining -= matchQty

		if resting.Quantity > matchQty {
			resting.Quantity -= matchQty
			newBook = append(newBook, resting)
		}
	}

	if remaining > 0 {
		incoming.Quantity = remaining
		newBook = append(newBook, incoming)
	}

	book = newBook

	status := "resting"

	if executed > 0 && remaining > 0 {
		status = "partial"
	}

	if remaining == 0 {
		status = "filled"
	}

	resp := Response{
		Status:           status,
		ExecutedQuantity: executed,
		Trades:           trades,
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(resp)
}

func main() {

	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/order", orderHandler)

	server := &http.Server{
		Addr:              ":8080",
		ReadHeaderTimeout: 5 * time.Second,
	}

	server.ListenAndServe()
}