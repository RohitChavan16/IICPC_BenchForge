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
  "status": "accepted",
  "latency": 12
}
```

### Status Definitions
- `accepted`: The order was received and processed successfully by the matching engine.
- `rejected`: The order was invalid or could not be processed.

### Trading Rules (Correctness Validation)
BenchForge runs a **Correctness Phase** to verify baseline stability. The target engine is expected to process orders without crashing or returning HTTP 500 errors. 
*(Note: Detailed trade execution tracking via full receipts is not currently enforced by the Bot Worker load generation loop).*
