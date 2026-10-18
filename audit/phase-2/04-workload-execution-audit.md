# BenchForge Phase 2 Audit — Workload Generation and Execution Validity

**Workstream C: Workload Generation, Personas, Concurrency, and Accounting**

---

## 1. Workload Architecture & Persona Definitions

BenchForge generates concurrent synthetic trading traffic against target engines using a pool of worker goroutines (default: 100 goroutines) managed by `bot-worker`.

### Persona Distribution Mix
Documented in `docs/benchmark_methodology.md` and implemented in `pool.go:25-51`:

| Persona Name | Target Ratio | Price Formula | Quantity Range | Side Selection | Actual Trading Semantics |
|---|---|---|---|---|---|
| **Retail Trader** | 60% | $100 + \text{rand}(0, 10)$ | $1 - 10$ | 50% Buy / 50% Sell | Small random limit orders around $100–$110. |
| **Market Maker** | 20% | $105 + \text{rand}(0, 2)$ | $50 - 99$ | 50% Buy / 50% Sell | Narrower price spread ($105–$107), medium size. |
| **Scalper** | 10% | $100 + \text{rand}(0, 20)$ | $1 - 5$ | 50% Buy / 50% Sell | Wider price spread ($100–$120), very small size. |
| **Whale** | 5% | $100 + \text{rand}(0, 20)$ | $1,000 - 4,999$ | 50% Buy / 50% Sell | Massive quantity blocks sweeping multiple levels. |
| **HFT Stressor** | 5% | $10 + \text{rand}(0, 200)$ | $1 - 3$ | 50% Buy / 50% Sell | Extreme wide prices ($10–$210), micro quantities. |
| **Tracer** | 5% override | Fixed ($100.00) | Fixed (10) | BUY resting $\to$ SELL match | Sequential 2-step concurrency test on unique `TRC-` symbol. |

---

## 2. Seed Handling and Reproducibility

### Deterministic Shuffle Verification
In [`workload_test.go:TestWorkload_PersonaDeterminismAndSeeds`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/workload_test.go#L30-L85):
- When a non-zero `seed` is provided (e.g., `seed = 42`), `GenerateDeterministicPersonaMix` initializes `rand.New(rand.NewSource(seed))` and performs a Fisher-Yates shuffle on the pre-allocated slice.
- Independent test execution verified that identical seeds produce **100% identical persona sequences** across independent runs.
- Rounding adjustments (line 33: `retailCount += total - (retailCount + mmCount + ...)`) correctly guarantee that the total mix length exactly matches `totalRequests`.

### Non-Deterministic Fallback (Seed = 0)
- If `seed == 0`, the code falls back to global `rand.Shuffle`. In Go, global `rand` before Go 1.20 was deterministically seeded with 1 unless `rand.Seed()` was called; in modern Go it is auto-seeded. Runs with `seed = 0` cannot be reproduced.

### Global Rand Advancement Defect (BF-P2-010)
In `bots.go:50-134`:
```go
func RetailTrader(rng *rand.Rand) Order {
    priceAdd := rand.Float64() * 10
    qty := rand.Intn(10)
    if rng != nil {
        priceAdd = rng.Float64() * 10
        qty = rng.Intn(10)
    }
    ...
```
`rand.Float64()` and `rand.Intn()` on the global random generator are called **unconditionally**, and then discarded if `rng != nil`. This unnecessarily mutates global random state, creating subtle thread contention across goroutines.

---

## 3. Concurrency and Worker Scheduling

### Atomic Workload Dispatch
Worker goroutines consume from a single unbuffered channel (`jobs <- chan int`). Each worker routes to a persona using an atomic counter:
```go
idx := atomic.AddInt64(&GlobalPersonaIdx, 1) - 1
botType = GlobalPersonaMix[idx % int64(len(GlobalPersonaMix))]
```
- **Verified:** Tested with 100 concurrent goroutines executing 10,000 requests (`workload_test.go:88-140`). Exactly 10,000 requests were dispatched with zero drops, zero duplicate index assignments, and exact preservation of the 60/20/10/5/5 persona ratio.

### Bounded HTTP Connection Pool
Implemented in `bots.go:16-32`:
- `MaxIdleConns`, `MaxIdleConnsPerHost`, and `MaxConnsPerHost` are strictly set to `workerCount * 2` (minimum 100).
- `IdleConnTimeout` is set to 90s; `Keep-Alive` is preserved.
- **Auditor Assessment:** This prevents OS ephemeral socket exhaustion and `TIME_WAIT` pileups during high-concurrency benchmarks.

---

## 4. Tracer Persona & Statistical Integrity

### Tracer Invocation Mechanism
The Tracer is **not** part of the pre-shuffled persona slice. Instead, in each worker loop iteration:
```go
isTracer = localRng.Float32() < 0.05
```
Each request has an independent 5% Bernoulli trial probability of running a Tracer scenario instead of the scheduled persona.

### Statistical Risk: Probability of Zero Tracers (BF-P2-007)
Because tracer selection is probabilistic ($p = 0.05$), the number of tracer invocations follows a Binomial distribution: $B(N, 0.05)$.
The probability of **zero** tracers executing in a benchmark of size $N$ is:
$$P(\text{TracerCount} = 0) = (1 - 0.05)^N = 0.95^N$$

Empirical Monte Carlo and theoretical calculations from [`workload_test.go:145-175`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/workload_test.go#L145-L175):

| Benchmark Size ($N$) | Theoretical $P(\text{Tracer}=0)$ | Monte Carlo Empirical (10,000 trials) | Auditor Impact |
|---|---|---|---|
| **$N = 10$ requests** | **59.87%** | 59.9% | Over half of all runs execute zero tracers. |
| **$N = 20$ requests** | **35.85%** | 35.8% | Over one third of runs execute zero tracers. |
| **$N = 50$ requests** | **7.69%** | 7.8% | ~1 in 13 runs executes zero tracers. |
| **$N = 100$ requests** | **0.59%** | 0.6% | ~1 in 170 runs executes zero tracers. |
| **$N = 1,000$ requests** | $< 10^{-22}$ | 0.0% | Extremely unlikely at full scale. |

### Impact on Scoring:
In `leaderboard.go:118`:
```go
concurrencyScore := 100.0 // Default to 100 if no tracers ran
if tracerTotal.Valid && tracerTotal.Int64 > 0 {
    concurrencyScore = (float64(tracerSuccess.Int64) / float64(tracerTotal.Int64)) * 100.0
}
```
If a benchmark runs with a small workload ($N \le 50$) or tests against a mock target and executes zero tracers, **`concurrencyScore` defaults to 100.0%**, granting the submission a perfect concurrency score without proving concurrency safety.

---

## 5. Persona Behavioral Reality vs Documentation Claims

| README / Documentation Claim | Actual Source Implementation | Discrepancy & Auditor Finding |
|---|---|---|
| "6 Distinct Trading Personas" | 5 personas in mix + 1 probabilistic override (Tracer) | Confirmed: Tracer is an override replacing regular requests, not a persona in the mix. |
| "Market orders sweep order book" | `Order` struct only contains `Price`, `Quantity`, `Side`, `Symbol` | **All personas submit Limit Orders.** No market orders exist anywhere in the workload. |
| "Crossing spread and order cancellation" | No cancellation endpoint or cancel orders exist | **Zero cancellations generated.** Target engine cancellation logic is completely untested. |
| "Diverse market scenarios" | 4 fixed stock symbols (`AAPL`, `MSFT`, `TSLA`, `AMZN`) | Workload is confined to 4 symbols with positive prices. No negative, zero, or malformed inputs are tested. |

---

## 6. Evaluation of the 10 Required Execution Scenarios

| Scenario | Tested / Analyzed Condition | Actual Platform Behavior | Evidence |
|---|---|---|---|
| **1. Small deterministic workload** | $N=50$, fixed seed | Dispatches 50 requests with exact 60/20/10/5/5 ratio. 7.7% risk of zero tracers. | `workload_test.go:153` |
| **2. Zero / minimal workload** | $N=0$ or duration $<1.0\text{s}$ | Handled by bot-worker, but leaderboard integer truncation records 0.0 TPS (Score = 0). | `metrics_test.go:195` |
| **3. High-concurrency workload** | 100 goroutines, 10,000 requests | Bounded HTTP connection pool handles concurrency without socket leaks. | `workload_test.go:88` |
| **4. Bursty workload** | Sudden traffic spikes | Not explicitly simulated; workers pull from channel at maximum rate without rate limiting. | `pool.go:74` |
| **5. Sustained workload** | Long-running benchmark | Heartbeat ticker pings `/heartbeat` every 15s to keep benchmark alive. | `main.go:264` |
| **6. Intentional engine failures** | Engine returns HTTP 500 | Penalized with flat 5000ms latency. Correctly forces P99 to 5000ms if $\ge 2\%$ fail. | `metrics_test.go:120` |
| **7. Malformed responses** | Empty JSON or corrupt body | Accepted as `success=true` during load testing by `checkCorrectnessStub`. | `oracle_test.go:395` |
| **8. Exceeded timeout** | Engine stalls $>5\text{s}$ | HTTP client times out at 5s (`bots.go:13`); request counted as failure (5000ms penalty). | `main.go:292` |
| **9. Repeated runs with identical seeds** | Two runs with `seed = 42` | Produced identical sequence of 1000 orders. | `workload_test.go:30` |
| **10. Unexpected worker crash** | Bot worker process terminates | 30s watchdog detects missed heartbeat ($>60\text{s}$), marks benchmark `FAILED`. | `watchdog.go:31` |
