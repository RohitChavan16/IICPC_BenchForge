package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sort"
	"sync"
	"testing"
	"time"
)

// Independent Reference Matching Engine (Oracle)
// Implements standard Price-Time Priority for a single symbol without depending on BenchForge code.

type Side string

const (
	Buy  Side = "buy"
	Sell Side = "sell"
)

type RefOrder struct {
	ID        string
	Symbol    string
	Side      Side
	Price     float64
	Quantity  int
	Remaining int
	Timestamp time.Time
}

type RefTrade struct {
	MakerOrderID string  `json:"maker_order_id"`
	Price        float64 `json:"price"`
	Quantity     int     `json:"quantity"`
}

type RefOrderResult struct {
	OrderID          string     `json:"order_id"`
	Status           string     `json:"status"`
	ExecutedQuantity int        `json:"executed_quantity"`
	Trades           []RefTrade `json:"trades"`
}

type ReferenceOrderBook struct {
	mu       sync.Mutex
	symbol   string
	bids     []*RefOrder // sorted highest price first, then oldest first
	asks     []*RefOrder // sorted lowest price first, then oldest first
	orderSeq int
}

func NewReferenceOrderBook(symbol string) *ReferenceOrderBook {
	return &ReferenceOrderBook{
		symbol: symbol,
		bids:   make([]*RefOrder, 0),
		asks:   make([]*RefOrder, 0),
	}
}

func (ob *ReferenceOrderBook) ProcessOrder(side Side, price float64, quantity int) RefOrderResult {
	ob.mu.Lock()
	defer ob.mu.Unlock()

	ob.orderSeq++
	orderID := fmt.Sprintf("ref-ord-%d", ob.orderSeq)

	order := &RefOrder{
		ID:        orderID,
		Symbol:    ob.symbol,
		Side:      side,
		Price:     price,
		Quantity:  quantity,
		Remaining: quantity,
		Timestamp: time.Now(),
	}

	trades := make([]RefTrade, 0)
	executedQty := 0

	if side == Buy {
		// Match against asks: lowest ask first
		for len(ob.asks) > 0 && order.Remaining > 0 {
			bestAsk := ob.asks[0]
			if bestAsk.Price > order.Price {
				// No price crossing
				break
			}

			matchQty := minInt(order.Remaining, bestAsk.Remaining)
			trades = append(trades, RefTrade{
				MakerOrderID: bestAsk.ID,
				Price:        bestAsk.Price, // Resting price (maker price)
				Quantity:     matchQty,
			})

			order.Remaining -= matchQty
			bestAsk.Remaining -= matchQty
			executedQty += matchQty

			if bestAsk.Remaining == 0 {
				ob.asks = ob.asks[1:] // remove filled maker
			}
		}

		if order.Remaining > 0 {
			// Resting bid
			ob.bids = append(ob.bids, order)
			sort.SliceStable(ob.bids, func(i, j int) bool {
				if ob.bids[i].Price != ob.bids[j].Price {
					return ob.bids[i].Price > ob.bids[j].Price // descending price
				}
				return ob.bids[i].Timestamp.Before(ob.bids[j].Timestamp) // FIFO
			})
		}
	} else {
		// Sell: Match against bids: highest bid first
		for len(ob.bids) > 0 && order.Remaining > 0 {
			bestBid := ob.bids[0]
			if bestBid.Price < order.Price {
				// No price crossing
				break
			}

			matchQty := minInt(order.Remaining, bestBid.Remaining)
			trades = append(trades, RefTrade{
				MakerOrderID: bestBid.ID,
				Price:        bestBid.Price, // Resting price
				Quantity:     matchQty,
			})

			order.Remaining -= matchQty
			bestBid.Remaining -= matchQty
			executedQty += matchQty

			if bestBid.Remaining == 0 {
				ob.bids = ob.bids[1:] // remove filled maker
			}
		}

		if order.Remaining > 0 {
			// Resting ask
			ob.asks = append(ob.asks, order)
			sort.SliceStable(ob.asks, func(i, j int) bool {
				if ob.asks[i].Price != ob.asks[j].Price {
					return ob.asks[i].Price < ob.asks[j].Price // ascending price
				}
				return ob.asks[i].Timestamp.Before(ob.asks[j].Timestamp) // FIFO
			})
		}
	}

	status := "resting"
	if order.Remaining == 0 {
		status = "filled"
	} else if executedQty > 0 {
		status = "partially_filled"
	}

	return RefOrderResult{
		OrderID:          orderID,
		Status:           status,
		ExecutedQuantity: executedQty,
		Trades:           trades,
	}
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// BenchForge Client Simulator: mimics bot-worker/scenario/executor.go RunScenario

type ScenarioStep struct {
	Symbol         string
	Side           Side
	Price          float64
	Quantity       int
	ExpectedStatus string
	ExpectedTrades []struct {
		MakerOrderRef *int
		Price         float64
		Quantity      int
	}
}

func runBenchForgeScenarioCheck(serverURL string, steps []ScenarioStep) (bool, string, string) {
	client := &http.Client{Timeout: 3 * time.Second}
	orderIDs := make([]string, len(steps))

	for i, step := range steps {
		body, _ := json.Marshal(map[string]interface{}{
			"symbol":   step.Symbol,
			"side":     string(step.Side),
			"price":    step.Price,
			"quantity": step.Quantity,
		})

		resp, err := client.Post(serverURL+"/order", "application/json", bytes.NewBuffer(body))
		if err != nil {
			return false, "FAILED", fmt.Sprintf("Step %d: request failed: %v", i+1, err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return false, "FAILED", fmt.Sprintf("Step %d: expected 200, got %d", i+1, resp.StatusCode)
		}

		var orderResp RefOrderResult
		if err := json.NewDecoder(resp.Body).Decode(&orderResp); err != nil {
			return false, "CONTRACT_NOT_SUPPORTED", fmt.Sprintf("Step %d: JSON parse failed", i+1)
		}

		orderIDs[i] = orderResp.OrderID

		// BenchForge legacy check
		if orderResp.Status == "" && len(orderResp.Trades) == 0 {
			return false, "CONTRACT_NOT_SUPPORTED", fmt.Sprintf("Step %d: missing status and trades", i+1)
		}

		if orderResp.Status != step.ExpectedStatus {
			return false, "FAILED", fmt.Sprintf("Step %d: status mismatch: expected %s, got %s", i+1, step.ExpectedStatus, orderResp.Status)
		}

		if len(orderResp.Trades) != len(step.ExpectedTrades) {
			return false, "FAILED", fmt.Sprintf("Step %d: trade count mismatch: expected %d, got %d", i+1, len(step.ExpectedTrades), len(orderResp.Trades))
		}

		for j, expTrade := range step.ExpectedTrades {
			actual := orderResp.Trades[j]
			if actual.Price != expTrade.Price || actual.Quantity != expTrade.Quantity {
				return false, "FAILED", fmt.Sprintf("Step %d, Trade %d: price/qty mismatch: expected %d@%.2f, got %d@%.2f", i+1, j+1, expTrade.Quantity, expTrade.Price, actual.Quantity, actual.Price)
			}
			if expTrade.MakerOrderRef != nil {
				refIdx := *expTrade.MakerOrderRef
				if refIdx < 0 || refIdx >= len(orderIDs) {
					return false, "FAILED", "invalid maker ref"
				}
				if actual.MakerOrderID != orderIDs[refIdx] {
					return false, "FAILED", fmt.Sprintf("Step %d, Trade %d: maker id mismatch: expected %s, got %s", i+1, j+1, orderIDs[refIdx], actual.MakerOrderID)
				}
			}
		}
	}

	return true, "PASSED", ""
}

// Tests for Core Trading Invariants against Oracle

func TestOracle_Invariants(t *testing.T) {
	ob := NewReferenceOrderBook("AAPL")

	// 1. Resting order
	res1 := ob.ProcessOrder(Buy, 150.0, 100)
	if res1.Status != "resting" || res1.ExecutedQuantity != 0 || len(res1.Trades) != 0 {
		t.Fatalf("Invariant violation: initial buy should rest")
	}

	// 2. Partial fill
	res2 := ob.ProcessOrder(Sell, 150.0, 40)
	if res2.Status != "filled" || res2.ExecutedQuantity != 40 || len(res2.Trades) != 1 {
		t.Fatalf("Invariant violation: sell should fill 40")
	}
	if res2.Trades[0].Quantity != 40 || res2.Trades[0].Price != 150.0 || res2.Trades[0].MakerOrderID != res1.OrderID {
		t.Fatalf("Trade details mismatch in partial fill")
	}

	// 3. Complete remaining resting order
	res3 := ob.ProcessOrder(Sell, 150.0, 60)
	if res3.Status != "filled" || res3.ExecutedQuantity != 60 || len(res3.Trades) != 1 {
		t.Fatalf("Invariant violation: second sell should fill remaining 60")
	}

	// 4. Overfilling test: new sell should now rest because book is empty
	res4 := ob.ProcessOrder(Sell, 150.0, 10)
	if res4.Status != "resting" || res4.ExecutedQuantity != 0 {
		t.Fatalf("Invariant violation: sell against empty book must rest, got status=%s", res4.Status)
	}
}

func TestOracle_PriceImprovement(t *testing.T) {
	ob := NewReferenceOrderBook("TSLA")

	// Maker rests at $100
	m := ob.ProcessOrder(Buy, 100.0, 10)
	if m.Status != "resting" {
		t.Fatalf("maker should rest")
	}

	// Taker aggressive sell at $90 -> must execute at resting price ($100)
	taker := ob.ProcessOrder(Sell, 90.0, 10)
	if taker.Status != "filled" || len(taker.Trades) != 1 {
		t.Fatalf("taker should fill")
	}
	if taker.Trades[0].Price != 100.0 {
		t.Fatalf("Price improvement failed: expected 100.0, got %v", taker.Trades[0].Price)
	}
}

func TestOracle_FIFOPriority(t *testing.T) {
	ob := NewReferenceOrderBook("GOOG")

	m1 := ob.ProcessOrder(Buy, 100.0, 10)
	m2 := ob.ProcessOrder(Buy, 100.0, 20)

	// Taker sells 15: must match m1 for 10 first, then m2 for 5
	taker := ob.ProcessOrder(Sell, 100.0, 15)
	if len(taker.Trades) != 2 {
		t.Fatalf("expected 2 trades, got %d", len(taker.Trades))
	}
	if taker.Trades[0].MakerOrderID != m1.OrderID || taker.Trades[0].Quantity != 10 {
		t.Fatalf("FIFO priority violated on first trade")
	}
	if taker.Trades[1].MakerOrderID != m2.OrderID || taker.Trades[1].Quantity != 5 {
		t.Fatalf("FIFO priority violated on second trade")
	}
}

// Adversarial Engine Evaluation against BenchForge Scenario Runner

func TestBenchForge_AdversarialEngines(t *testing.T) {
	refIdx0 := 0
	sampleScenario := []ScenarioStep{
		{
			Symbol: "AAPL", Side: Buy, Price: 150.0, Quantity: 100,
			ExpectedStatus: "resting", ExpectedTrades: nil,
		},
		{
			Symbol: "AAPL", Side: Sell, Price: 150.0, Quantity: 50,
			ExpectedStatus: "filled", ExpectedTrades: []struct {
				MakerOrderRef *int
				Price         float64
				Quantity      int
			}{
				{MakerOrderRef: &refIdx0, Price: 150.0, Quantity: 50},
			},
		},
	}

	// 1. Correct Engine using Oracle Server
	t.Run("Valid Oracle Server", func(t *testing.T) {
		ob := NewReferenceOrderBook("AAPL")
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var ord struct {
				Side     Side    `json:"side"`
				Price    float64 `json:"price"`
				Quantity int     `json:"quantity"`
			}
			json.NewDecoder(r.Body).Decode(&ord)
			res := ob.ProcessOrder(ord.Side, ord.Price, ord.Quantity)
			json.NewEncoder(w).Encode(res)
		}))
		defer ts.Close()

		passed, status, err := runBenchForgeScenarioCheck(ts.URL, sampleScenario)
		if !passed || status != "PASSED" {
			t.Fatalf("Oracle server should pass, got passed=%v status=%s err=%s", passed, status, err)
		}
	})

	// 2. Adversarial Engine: Returns 200 OK with legacy format {"status":"accepted"}
	t.Run("Legacy Format Returns CONTRACT_NOT_SUPPORTED", func(t *testing.T) {
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"accepted","latency":10}`))
		}))
		defer ts.Close()

		passed, status, _ := runBenchForgeScenarioCheck(ts.URL, sampleScenario)
		// Expected status mismatch: expected "resting", got "accepted" -> FAILED
		if passed {
			t.Fatalf("Legacy server must not pass scenario check")
		}
		if status != "FAILED" {
			t.Logf("Note: Status returned was %s (status mismatch before legacy check)", status)
		}
	})

	// 3. Adversarial Engine: Returns 200 OK with empty json {}
	t.Run("Empty JSON Engine Returns CONTRACT_NOT_SUPPORTED", func(t *testing.T) {
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{}`))
		}))
		defer ts.Close()

		passed, status, _ := runBenchForgeScenarioCheck(ts.URL, sampleScenario)
		if passed || status != "CONTRACT_NOT_SUPPORTED" {
			t.Fatalf("Empty JSON must return CONTRACT_NOT_SUPPORTED, got passed=%v status=%s", passed, status)
		}
	})

	// 4. Adversarial Engine: Canned / Fake Matcher that returns canned "resting" and "filled" without matching
	t.Run("Canned Response Passes Validation", func(t *testing.T) {
		stepCount := 0
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			stepCount++
			if stepCount == 1 {
				json.NewEncoder(w).Encode(RefOrderResult{
					OrderID: "fixed-order-1",
					Status:  "resting",
				})
			} else {
				json.NewEncoder(w).Encode(RefOrderResult{
					OrderID: "fixed-order-2",
					Status:  "filled",
					Trades: []RefTrade{
						{MakerOrderID: "fixed-order-1", Price: 150.0, Quantity: 50},
					},
				})
			}
		}))
		defer ts.Close()

		passed, status, err := runBenchForgeScenarioCheck(ts.URL, sampleScenario)
		if !passed {
			t.Fatalf("Canned engine unexpectedly failed: %v %s", status, err)
		}
		t.Logf("CONFIRMED: Canned static engine without any order book passes scenario runner: passed=%v status=%s", passed, status)
	})

	// 5. Flawed Engine: Ignores resting price and trades at taker price
	t.Run("Price Inversion Engine Caught by Scenario Runner", func(t *testing.T) {
		stepCount := 0
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			stepCount++
			if stepCount == 1 {
				json.NewEncoder(w).Encode(RefOrderResult{OrderID: "ord-1", Status: "resting"})
			} else {
				json.NewEncoder(w).Encode(RefOrderResult{
					OrderID: "ord-2",
					Status:  "filled",
					Trades: []RefTrade{
						{MakerOrderID: "ord-1", Price: 140.0, Quantity: 50}, // WRONG PRICE
					},
				})
			}
		}))
		defer ts.Close()

		passed, status, err := runBenchForgeScenarioCheck(ts.URL, sampleScenario)
		if passed || status != "FAILED" {
			t.Fatalf("Price inversion engine should be caught! passed=%v err=%s", passed, err)
		}
		t.Logf("Confirmed: Scenario runner successfully caught price inversion: %s", err)
	})
}
