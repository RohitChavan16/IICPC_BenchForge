package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
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
	mu       sync.Mutex
	buyBook  []Order
	sellBook []Order
)

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}

func orderHandler(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var incoming Order

	if err := json.NewDecoder(r.Body).Decode(&incoming); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	var trades []Trade
	executed := 0

	if incoming.Side == "buy" {

		var remaining []Order

		for _, sell := range sellBook {

			if incoming.Quantity == 0 {
				remaining = append(remaining, sell)
				continue
			}

			if sell.Symbol != incoming.Symbol {
				remaining = append(remaining, sell)
				continue
			}

			if incoming.Price >= sell.Price {

				matchQty := min(incoming.Quantity, sell.Quantity)

				trades = append(trades, Trade{
					MakerOrderID: sell.OrderID,
					Price:        sell.Price, // price improvement
					Quantity:     matchQty,
				})

				incoming.Quantity -= matchQty
				executed += matchQty

				if sell.Quantity > matchQty {
					sell.Quantity -= matchQty
					remaining = append(remaining, sell)
				}

			} else {
				remaining = append(remaining, sell)
			}
		}

		sellBook = remaining

		if incoming.Quantity > 0 {
			buyBook = append(buyBook, incoming)
		}

	} else {

		var remaining []Order

		for _, buy := range buyBook {

			if incoming.Quantity == 0 {
				remaining = append(remaining, buy)
				continue
			}

			if buy.Symbol != incoming.Symbol {
				remaining = append(remaining, buy)
				continue
			}

			if incoming.Price <= buy.Price {

				matchQty := min(incoming.Quantity, buy.Quantity)

				trades = append(trades, Trade{
					MakerOrderID: buy.OrderID,
					Price:        buy.Price,
					Quantity:     matchQty,
				})

				incoming.Quantity -= matchQty
				executed += matchQty

				if buy.Quantity > matchQty {
					buy.Quantity -= matchQty
					remaining = append(remaining, buy)
				}

			} else {
				remaining = append(remaining, buy)
			}
		}

		buyBook = remaining

		if incoming.Quantity > 0 {
			sellBook = append(sellBook, incoming)
		}
	}

	status := "resting"

	if executed > 0 && incoming.Quantity == 0 {
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

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func main() {

	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/order", orderHandler)

	log.Println("Exchange Engine listening on :8080")

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}