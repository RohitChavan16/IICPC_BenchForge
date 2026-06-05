package scenario

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/bots"
)

type TradeResponse struct {
	MakerOrderID string  `json:"maker_order_id"`
	Price        float64 `json:"price"`
	Quantity     int     `json:"quantity"`
}

type OrderResponse struct {
	OrderID          string          `json:"order_id"`
	Status           string          `json:"status"`
	ExecutedQuantity int             `json:"executed_quantity"`
	Trades           []TradeResponse `json:"trades"`
}

type ExpectedTrade struct {
	MakerOrderRef *int    `json:"maker_order_ref"` // Step index (0-based) of the maker order
	Price         float64 `json:"price"`
	Quantity      int     `json:"quantity"`
}

type OrderStep struct {
	Order          bots.Order      `json:"order"`
	ExpectedStatus string          `json:"expected_status"`
	ExpectedTrades []ExpectedTrade `json:"expected_trades"`
}

type Scenario struct {
	Name  string      `json:"name"`
	Steps []OrderStep `json:"steps"`
}

type ScenarioResult struct {
	Name         string `json:"name"`
	Passed       bool   `json:"passed"`
	ErrorMessage string `json:"error_message"`
	Status       string `json:"status"` // "PASSED", "FAILED", "CONTRACT_NOT_SUPPORTED"
}

func RunScenario(ctx context.Context, targetURL string, s Scenario) ScenarioResult {
	client := &http.Client{Timeout: 5 * time.Second}
	orderIDs := make([]string, len(s.Steps))

	for i, step := range s.Steps {
		body, _ := json.Marshal(step.Order)
		req, err := http.NewRequestWithContext(ctx, "POST", targetURL+"/order", bytes.NewBuffer(body))
		if err != nil {
			return ScenarioResult{Name: s.Name, Passed: false, Status: "FAILED", ErrorMessage: fmt.Sprintf("Step %d: request creation failed: %v", i+1, err)}
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			return ScenarioResult{Name: s.Name, Passed: false, Status: "FAILED", ErrorMessage: fmt.Sprintf("Step %d: request failed: %v", i+1, err)}
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return ScenarioResult{Name: s.Name, Passed: false, Status: "FAILED", ErrorMessage: fmt.Sprintf("Step %d: expected 200 OK, got %d", i+1, resp.StatusCode)}
		}

		var orderResp OrderResponse
		if err := json.NewDecoder(resp.Body).Decode(&orderResp); err != nil {
			return ScenarioResult{Name: s.Name, Passed: false, Status: "CONTRACT_NOT_SUPPORTED", ErrorMessage: fmt.Sprintf("Step %d: failed to parse JSON, or legacy response", i+1)}
		}
		
		orderIDs[i] = orderResp.OrderID

		// Contract Check: If missing Trades and Status is empty, it's likely a legacy format
		if orderResp.Status == "" && len(orderResp.Trades) == 0 {
			// Legacy might return { "success": true }, orderResp parsing wouldn't error but fields would be empty.
			return ScenarioResult{Name: s.Name, Passed: false, Status: "CONTRACT_NOT_SUPPORTED", ErrorMessage: fmt.Sprintf("Step %d: missing expected API v1 fields", i+1)}
		}

		if orderResp.Status != step.ExpectedStatus {
			return ScenarioResult{Name: s.Name, Passed: false, Status: "FAILED", ErrorMessage: fmt.Sprintf("Step %d: expected status %s, got %s", i+1, step.ExpectedStatus, orderResp.Status)}
		}

		if len(orderResp.Trades) != len(step.ExpectedTrades) {
			return ScenarioResult{Name: s.Name, Passed: false, Status: "FAILED", ErrorMessage: fmt.Sprintf("Step %d: expected %d trades, got %d", i+1, len(step.ExpectedTrades), len(orderResp.Trades))}
		}

		// Verify trades
		for j, expectedTrade := range step.ExpectedTrades {
			actualTrade := orderResp.Trades[j]
			if actualTrade.Price != expectedTrade.Price || actualTrade.Quantity != expectedTrade.Quantity {
				return ScenarioResult{Name: s.Name, Passed: false, Status: "FAILED", ErrorMessage: fmt.Sprintf("Step %d, Trade %d: expected %d @ %.2f, got %d @ %.2f", i+1, j+1, expectedTrade.Quantity, expectedTrade.Price, actualTrade.Quantity, actualTrade.Price)}
			}
			if expectedTrade.MakerOrderRef != nil {
				refIdx := *expectedTrade.MakerOrderRef
				if refIdx < 0 || refIdx >= len(orderIDs) {
					return ScenarioResult{Name: s.Name, Passed: false, Status: "FAILED", ErrorMessage: fmt.Sprintf("Step %d, Trade %d: invalid maker_order_ref %d", i+1, j+1, refIdx)}
				}
				expectedMakerID := orderIDs[refIdx]
				if actualTrade.MakerOrderID != expectedMakerID {
					return ScenarioResult{Name: s.Name, Passed: false, Status: "FAILED", ErrorMessage: fmt.Sprintf("Step %d, Trade %d: expected maker_order_id %s (from step %d), got %s", i+1, j+1, expectedMakerID, refIdx+1, actualTrade.MakerOrderID)}
				}
			}
		}
	}

	return ScenarioResult{Name: s.Name, Passed: true, Status: "PASSED", ErrorMessage: ""}
}
