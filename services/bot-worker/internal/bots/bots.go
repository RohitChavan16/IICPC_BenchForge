package bots

import (
	"bytes"
	"encoding/json"
	"math/rand"
	"net/http"
	"time"
	"context"
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

func RetailTrader() Order {
	return Order{
		Symbol:   "AAPL",
		Price:    100 + rand.Float64()*10,
		Quantity: rand.Intn(10) + 1,
		Side:     "buy",
	}
}

func HFTBot() Order {
	return Order{
		Symbol:   "BTCUSD",
		Price:    50000 + rand.Float64()*100,
		Quantity: 1,
		Side:     "sell",
	}
}

func WhaleBot() Order {
	return Order{
		Symbol:   "ETHUSD",
		Price:    3000,
		Quantity: 1000,
		Side:     "buy",
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