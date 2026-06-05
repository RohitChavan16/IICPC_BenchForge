package scenario

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/bots"
)

func ref(i int) *int {
	return &i
}

func TestPartialFill(t *testing.T) {
	s := Scenario{
		Name: "partial_fill_order",
		Steps: []OrderStep{
			{
				Order:          bots.Order{Symbol: "AMZN", Price: 100.0, Quantity: 100, Side: "buy"},
				ExpectedStatus: "resting",
				ExpectedTrades: []ExpectedTrade{},
			},
			{
				Order:          bots.Order{Symbol: "AMZN", Price: 100.0, Quantity: 50, Side: "sell"},
				ExpectedStatus: "filled",
				ExpectedTrades: []ExpectedTrade{
					{MakerOrderRef: ref(0), Price: 100.0, Quantity: 50},
				},
			},
			{
				Order:          bots.Order{Symbol: "AMZN", Price: 100.0, Quantity: 50, Side: "sell"},
				ExpectedStatus: "filled",
				ExpectedTrades: []ExpectedTrade{
					{MakerOrderRef: ref(0), Price: 100.0, Quantity: 50},
				},
			},
		},
	}

	runEngineTest(t, "Valid Engine", s, func(stepIdx int) OrderResponse {
		if stepIdx == 0 {
			return OrderResponse{OrderID: "maker1", Status: "resting"}
		}
		if stepIdx == 1 || stepIdx == 2 {
			return OrderResponse{OrderID: "taker1", Status: "filled", Trades: []TradeResponse{{MakerOrderID: "maker1", Price: 100.0, Quantity: 50}}}
		}
		return OrderResponse{}
	}, true)

	runEngineTest(t, "Broken Engine (overfills)", s, func(stepIdx int) OrderResponse {
		if stepIdx == 0 {
			return OrderResponse{OrderID: "maker1", Status: "resting"}
		}
		if stepIdx == 1 {
			// Engine incorrectly returns 100 quantity instead of 50
			return OrderResponse{OrderID: "taker1", Status: "filled", Trades: []TradeResponse{{MakerOrderID: "maker1", Price: 100.0, Quantity: 100}}}
		}
		return OrderResponse{}
	}, false)
}

func TestPriceImprovement(t *testing.T) {
	s := Scenario{
		Name: "price_improvement",
		Steps: []OrderStep{
			{
				Order:          bots.Order{Symbol: "TSLA", Price: 100.0, Quantity: 10, Side: "buy"},
				ExpectedStatus: "resting",
				ExpectedTrades: []ExpectedTrade{},
			},
			{
				Order:          bots.Order{Symbol: "TSLA", Price: 90.0, Quantity: 10, Side: "sell"},
				ExpectedStatus: "filled",
				ExpectedTrades: []ExpectedTrade{
					{MakerOrderRef: ref(0), Price: 100.0, Quantity: 10},
				},
			},
		},
	}

	runEngineTest(t, "Valid Engine", s, func(stepIdx int) OrderResponse {
		if stepIdx == 0 {
			return OrderResponse{OrderID: "maker1", Status: "resting"}
		}
		if stepIdx == 1 {
			return OrderResponse{OrderID: "taker1", Status: "filled", Trades: []TradeResponse{{MakerOrderID: "maker1", Price: 100.0, Quantity: 10}}}
		}
		return OrderResponse{}
	}, true)

	runEngineTest(t, "Broken Engine (uses taker price)", s, func(stepIdx int) OrderResponse {
		if stepIdx == 0 {
			return OrderResponse{OrderID: "maker1", Status: "resting"}
		}
		if stepIdx == 1 {
			// Engine incorrectly uses the taker's price of 90 instead of the resting price of 100
			return OrderResponse{OrderID: "taker1", Status: "filled", Trades: []TradeResponse{{MakerOrderID: "maker1", Price: 90.0, Quantity: 10}}}
		}
		return OrderResponse{}
	}, false)
}

func TestFIFOPriority(t *testing.T) {
	s := Scenario{
		Name: "fifo_priority",
		Steps: []OrderStep{
			{
				Order:          bots.Order{Symbol: "GOOG", Price: 100.0, Quantity: 10, Side: "buy"},
				ExpectedStatus: "resting",
				ExpectedTrades: []ExpectedTrade{},
			},
			{
				Order:          bots.Order{Symbol: "GOOG", Price: 100.0, Quantity: 20, Side: "buy"},
				ExpectedStatus: "resting",
				ExpectedTrades: []ExpectedTrade{},
			},
			{
				Order:          bots.Order{Symbol: "GOOG", Price: 100.0, Quantity: 15, Side: "sell"},
				ExpectedStatus: "filled",
				ExpectedTrades: []ExpectedTrade{
					{MakerOrderRef: ref(0), Price: 100.0, Quantity: 10},
					{MakerOrderRef: ref(1), Price: 100.0, Quantity: 5},
				},
			},
		},
	}

	runEngineTest(t, "Valid Engine", s, func(stepIdx int) OrderResponse {
		if stepIdx == 0 {
			return OrderResponse{OrderID: "maker1", Status: "resting"}
		}
		if stepIdx == 1 {
			return OrderResponse{OrderID: "maker2", Status: "resting"}
		}
		if stepIdx == 2 {
			return OrderResponse{OrderID: "taker1", Status: "filled", Trades: []TradeResponse{
				{MakerOrderID: "maker1", Price: 100.0, Quantity: 10},
				{MakerOrderID: "maker2", Price: 100.0, Quantity: 5},
			}}
		}
		return OrderResponse{}
	}, true)

	runEngineTest(t, "Broken Engine (ignored FIFO)", s, func(stepIdx int) OrderResponse {
		if stepIdx == 0 {
			return OrderResponse{OrderID: "maker1", Status: "resting"}
		}
		if stepIdx == 1 {
			return OrderResponse{OrderID: "maker2", Status: "resting"}
		}
		if stepIdx == 2 {
			// Engine incorrectly matches the larger order first
			return OrderResponse{OrderID: "taker1", Status: "filled", Trades: []TradeResponse{
				{MakerOrderID: "maker2", Price: 100.0, Quantity: 15},
			}}
		}
		return OrderResponse{}
	}, false)
}

func TestMultiLevelPriceSweep(t *testing.T) {
	s := Scenario{
		Name: "multi_level_price_sweep",
		Steps: []OrderStep{
			{Order: bots.Order{Symbol: "NVDA", Price: 100.0, Quantity: 10, Side: "sell"}, ExpectedStatus: "resting", ExpectedTrades: []ExpectedTrade{}},
			{Order: bots.Order{Symbol: "NVDA", Price: 101.0, Quantity: 10, Side: "sell"}, ExpectedStatus: "resting", ExpectedTrades: []ExpectedTrade{}},
			{Order: bots.Order{Symbol: "NVDA", Price: 102.0, Quantity: 10, Side: "sell"}, ExpectedStatus: "resting", ExpectedTrades: []ExpectedTrade{}},
			{
				Order:          bots.Order{Symbol: "NVDA", Price: 105.0, Quantity: 25, Side: "buy"},
				ExpectedStatus: "filled",
				ExpectedTrades: []ExpectedTrade{
					{MakerOrderRef: ref(0), Price: 100.0, Quantity: 10},
					{MakerOrderRef: ref(1), Price: 101.0, Quantity: 10},
					{MakerOrderRef: ref(2), Price: 102.0, Quantity: 5},
				},
			},
		},
	}

	runEngineTest(t, "Valid Engine", s, func(stepIdx int) OrderResponse {
		if stepIdx == 0 {
			return OrderResponse{OrderID: "maker1", Status: "resting"}
		}
		if stepIdx == 1 {
			return OrderResponse{OrderID: "maker2", Status: "resting"}
		}
		if stepIdx == 2 {
			return OrderResponse{OrderID: "maker3", Status: "resting"}
		}
		if stepIdx == 3 {
			return OrderResponse{OrderID: "taker1", Status: "filled", Trades: []TradeResponse{
				{MakerOrderID: "maker1", Price: 100.0, Quantity: 10},
				{MakerOrderID: "maker2", Price: 101.0, Quantity: 10},
				{MakerOrderID: "maker3", Price: 102.0, Quantity: 5},
			}}
		}
		return OrderResponse{}
	}, true)
}

func runEngineTest(t *testing.T, name string, s Scenario, engineLogic func(stepIdx int) OrderResponse, expectedPass bool) {
	t.Run(name, func(t *testing.T) {
		stepCounter := 0
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			resp := engineLogic(stepCounter)
			stepCounter++
			json.NewEncoder(w).Encode(resp)
		}))
		defer ts.Close()

		res := RunScenario(context.Background(), ts.URL, s)
		if res.Passed != expectedPass {
			t.Errorf("Expected Passed=%v, got %v. ErrorMessage: %s", expectedPass, res.Passed, res.ErrorMessage)
		}
	})
}
