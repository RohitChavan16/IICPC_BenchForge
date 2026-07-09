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

func CreateHTTPClient(workerCount int) *http.Client {
	maxConns := workerCount * 2
	if maxConns < 100 {
		maxConns = 100
	}
	return &http.Client{
		Timeout: 5 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:          maxConns,
			MaxIdleConnsPerHost:   maxConns,
			MaxConnsPerHost:       maxConns,
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   10 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
		},
	}
}

type Order struct {
	Symbol   string  `json:"symbol"`
	Price    float64 `json:"price"`
	Quantity int     `json:"quantity"`
	Side     string  `json:"side"`
}

var symbols = []string{"AAPL", "MSFT", "TSLA", "AMZN"}

func randomSymbol(rng *rand.Rand) string {
	if rng != nil {
		return symbols[rng.Intn(len(symbols))]
	}
	return symbols[rand.Intn(len(symbols))]
}

func randomSide(rng *rand.Rand) string {
	val := rand.Float32()
	if rng != nil {
		val = rng.Float32()
	}
	if val < 0.5 {
		return "buy"
	}
	return "sell"
}

func RetailTrader(rng *rand.Rand) Order {
	priceAdd := rand.Float64() * 10
	qty := rand.Intn(10)
	if rng != nil {
		priceAdd = rng.Float64() * 10
		qty = rng.Intn(10)
	}
	return Order{
		Symbol:   randomSymbol(rng),
		Price:    100 + priceAdd,
		Quantity: qty + 1,
		Side:     randomSide(rng),
	}
}

func MarketMaker(rng *rand.Rand) Order {
	priceAdd := rand.Float64() * 2
	qty := rand.Intn(50)
	if rng != nil {
		priceAdd = rng.Float64() * 2
		qty = rng.Intn(50)
	}
	return Order{
		Symbol:   randomSymbol(rng),
		Price:    105 + priceAdd, // Tighter spread
		Quantity: 50 + qty,       // Medium size
		Side:     randomSide(rng),// Balanced
	}
}

func Scalper(rng *rand.Rand) Order {
	priceAdd := rand.Float64() * 20
	qty := rand.Intn(5)
	if rng != nil {
		priceAdd = rng.Float64() * 20
		qty = rng.Intn(5)
	}
	return Order{
		Symbol:   randomSymbol(rng),
		Price:    100 + priceAdd, // Wider range, crossing spread
		Quantity: 1 + qty,        // Small quantity
		Side:     randomSide(rng),
	}
}

func Whale(rng *rand.Rand) Order {
	priceAdd := rand.Float64() * 20
	qty := rand.Intn(4000)
	if rng != nil {
		priceAdd = rng.Float64() * 20
		qty = rng.Intn(4000)
	}
	return Order{
		Symbol:   randomSymbol(rng),
		Price:    100 + priceAdd, // Sweeping book
		Quantity: 1000 + qty,     // Massive quantity
		Side:     randomSide(rng),
	}
}

func HFTStressor(rng *rand.Rand) Order {
	priceAdd := rand.Float64() * 200
	qty := rand.Intn(3)
	if rng != nil {
		priceAdd = rng.Float64() * 200
		qty = rng.Intn(3)
	}
	return Order{
		Symbol:   randomSymbol(rng),
		Price:    10 + priceAdd, // Extreme random pricing
		Quantity: 1 + qty,       // 1-3 quantity
		Side:     randomSide(rng),
	}
}

func SendOrder(ctx context.Context, client *http.Client, exchangeURL string, order Order) (*http.Response, error) {
	if client == nil {
		client = httpClient
	}
	body, _ := json.Marshal(order)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, exchangeURL+"/order", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	return client.Do(req)
}