package bots

import (
	"bytes"
	"context"
	"encoding/json"
	"math/rand"
	"net/http"
	"time"
)

var httpClient = &http.Client{
	Timeout: 5 * time.Second,
}

type Order struct {
	Symbol   string  `json:"symbol"`
	Price    float64 `json:"price"`
	Quantity int     `json:"quantity"`
	Side     string  `json:"side"`
}

var symbols = []string{"AAPL", "MSFT", "TSLA", "AMZN"}

func randomSymbol() string {
	return symbols[rand.Intn(len(symbols))]
}

func randomSide() string {
	if rand.Float32() < 0.5 {
		return "buy"
	}
	return "sell"
}

func RetailTrader() Order {
	return Order{
		Symbol:   randomSymbol(),
		Price:    100 + rand.Float64()*10,
		Quantity: rand.Intn(10) + 1,
		Side:     randomSide(),
	}
}

func MarketMaker() Order {
	return Order{
		Symbol:   randomSymbol(),
		Price:    105 + rand.Float64()*2, // Tighter spread
		Quantity: 50 + rand.Intn(50),     // Medium size
		Side:     randomSide(),           // Balanced
	}
}

func Scalper() Order {
	return Order{
		Symbol:   randomSymbol(),
		Price:    100 + rand.Float64()*20, // Wider range, crossing spread
		Quantity: 1 + rand.Intn(5),        // Small quantity
		Side:     randomSide(),
	}
}

func Whale() Order {
	return Order{
		Symbol:   randomSymbol(),
		Price:    100 + rand.Float64()*20, // Sweeping book
		Quantity: 1000 + rand.Intn(4000),  // Massive quantity
		Side:     randomSide(),
	}
}

func HFTStressor() Order {
	return Order{
		Symbol:   randomSymbol(),
		Price:    10 + rand.Float64()*200, // Extreme random pricing
		Quantity: 1 + rand.Intn(3),        // 1-3 quantity
		Side:     randomSide(),
	}
}

func SendOrder(ctx context.Context, exchangeURL string, order Order) (*http.Response, error) {
	body, _ := json.Marshal(order)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, exchangeURL+"/order", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	return httpClient.Do(req)
}