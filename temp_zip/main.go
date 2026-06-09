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
	mu        sync.Mutex
	orderBook []Order
	reqCount  int
)

func orderHandler(w http.ResponseWriter, r *http.Request) {
	reqCount++

	var o Order

	if err := json.NewDecoder(r.Body).Decode(&o); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Simulate benchmark phases

	switch {
	case reqCount < 300:
		// normal

	case reqCount < 500:
		// whale phase
		time.Sleep(10 * time.Millisecond)

	case reqCount < 700:
		// latency spike
		time.Sleep(80 * time.Millisecond)

	default:
		// recovery
		time.Sleep(5 * time.Millisecond)
	}

	var trades []Trade
	executed := 0
	remaining := o.Quantity

	mu.Lock()
	defer mu.Unlock()

	var nextBook []Order

	for _, resting := range orderBook {

		if remaining == 0 {
			nextBook = append(nextBook, resting)
			continue
		}

		match := false

		if resting.Symbol == o.Symbol &&
			resting.Side != o.Side {

			if o.Side == "buy" && o.Price >= resting.Price {
				match = true
			}

			if o.Side == "sell" && o.Price <= resting.Price {
				match = true
			}
		}

		if !match {
			nextBook = append(nextBook, resting)
			continue
		}

		qty := remaining

		if resting.Quantity < qty {
			qty = resting.Quantity
		}

		trades = append(trades, Trade{
			MakerOrderID: resting.OrderID,
			Price:        resting.Price,
			Quantity:     qty,
		})

		executed += qty
		remaining -= qty

		if resting.Quantity > qty {
			resting.Quantity -= qty
			nextBook = append(nextBook, resting)
		}
	}

	if remaining > 0 {
		o.Quantity = remaining
		nextBook = append(nextBook, o)
	}

	orderBook = nextBook

	status := "resting"

	if remaining == 0 {
		status = "filled"
	} else if executed > 0 {
		status = "partial"
	}

	resp := Response{
		Status:           status,
		ExecutedQuantity: executed,
		Trades:           trades,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

func main() {
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/order", orderHandler)

	http.ListenAndServe(":8080", nil)
}