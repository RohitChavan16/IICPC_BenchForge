# BenchForge Exchange API v1 Specification

This document defines the required REST API contracts that your matching engine must implement to be evaluated by BenchForge.

## 1. Health Check
BenchForge will ping this endpoint to verify your engine is ready to receive orders.

**Endpoint:** `GET /health`
**Expected Response:** `200 OK`

---

## 2. Submit Order
This is the core matching endpoint. BenchForge will submit orders here. Your engine must process the order synchronously (or pseudo-synchronously) and return the resulting state of that order, including any trades that were executed against resting orders on the book.

**Endpoint:** `POST /order`
**Content-Type:** `application/json`

### Request Body

```json
{
  "order_id": "string (UUID)",
  "symbol": "string (e.g. 'AAPL')",
  "side": "buy" | "sell",
  "price": "number (float or string)",
  "quantity": "number"
}
```

### Response Body

Your engine must return `200 OK` with the following JSON payload representing the state of the order after the matching engine has processed it.

```json
{
  "status": "resting" | "partial" | "filled" | "rejected",
  "executed_quantity": 50,
  "trades": [
    {
      "maker_order_id": "string (the ID of the resting order that was matched)",
      "price": "number (the price at which the trade occurred)",
      "quantity": "number (the amount traded)"
    }
  ]
}
```

### Status Definitions
- `resting`: The order was fully added to the order book and generated no trades. (`executed_quantity` must be 0, `trades` must be empty).
- `partial`: The order matched partially. The remainder is resting on the book. (`executed_quantity` > 0 but < requested quantity, `trades` must contain the matches).
- `filled`: The order matched completely. Nothing is resting on the book. (`executed_quantity` == requested quantity, `trades` must contain the matches).
- `rejected`: The order was invalid or could not be processed.

### Trading Rules (Correctness Validation)
BenchForge will run a **Correctness Phase** before the throughput benchmark to verify:
1. **Price-Time Priority (FIFO)**: Orders at the same price must match against resting orders in the exact sequence the resting orders arrived.
2. **Price Improvement**: An incoming taker order that crosses the spread must match at the resting maker's better price.
3. **Fill Accuracy**: The sum of quantities in the `trades` array must exactly equal the `executed_quantity`, and neither can exceed the requested order quantity.

### Backward Compatibility
If your engine returns a legacy response (e.g., `{ "success": true }` or missing `trades`), your Correctness Score will be marked as `UNKNOWN`. You will not be penalized during Phase 1 of the migration, but you will need to implement this specification fully to qualify for final leaderboard rankings in Phase 2.
