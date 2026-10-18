# BenchForge Phase 4 — Workload Design and Safety Boundaries

**Audit Date:** 2026-10-17  
**Scope:** Controlled performance workload definitions, order generator persona mixtures, deterministic seeding, and environmental safety limits.  
**Auditor:** Independent Senior Performance & Systems Auditor (Phase 4)

---

## 1. Executive Summary

BenchForge generates trading engine benchmark traffic through a pool of concurrent worker goroutines executing parameterized persona models. To establish meaningful performance boundaries without triggering unrecoverable system crashes (such as host OOM kills or socket exhaustion), this audit designed a controlled, deterministic suite of workloads ranging from light baseline smoke tests to maximum safe stress levels.

The audit verified that while BenchForge claims to simulate complex market conditions, **the actual implementation only emits resting and crossing limit orders** (BF-P2-008). Market orders and order cancellations do not exist in the workload generation engine.

---

## 2. Verified Persona Distribution

In `services/bot-worker/internal/workers/pool.go:25-52`, BenchForge constructs a deterministic array of trading personas:

```go
func GenerateDeterministicPersonaMix(total int, seed int64) {
    retailCount  := int(float64(total) * 0.60) // 60%
    mmCount      := int(float64(total) * 0.20) // 20%
    scalperCount := int(float64(total) * 0.10) // 10%
    whaleCount   := int(float64(total) * 0.05) //  5%
    hftCount     := int(float64(total) * 0.05) //  5%
    ...
```

| Persona Name | Population Mix | Order Characteristics | Implemented Behavior |
| :--- | :---: | :--- | :--- |
| **Retail Trader** | 60% | Qty: 1–10, Price: Base $\pm$ \$10 | Random resting limit orders. Small order size. |
| **Market Maker** | 20% | Qty: 50–100, Price: Base $\pm$ \$2 | Tighter spread, medium size limit orders. |
| **Scalper** | 10% | Qty: 1–6, Price: Base $\pm$ \$20 | Crossing the spread, aggressive prices. |
| **Whale** | 5% | Qty: 1,000–5,000, Price: Base $\pm$ \$20 | Book-sweeping bulk volume orders. |
| **HFT Stressor** | 5% | Qty: 1–4, Price: Base $\pm$ \$200 | Out-of-bounds extreme prices for book depth stress. |
| **Tracer Scenario** | 5% (probabilistic) | 2-step BUY $\to$ SELL match | Checks deterministic match and execution receipt. |

> [!WARNING]
> **Workload Limitation (BF-P2-008):** In `bots.go:34-135`, every persona submits an HTTP POST to `/order` with limit prices. No persona calls `/cancel` or submits market orders. A trading engine with memory leaks during order cancellation or broken cancellation locks is completely unexercised by BenchForge.

---

## 3. Workload Specification Suite

The following 5 standard workloads were defined to evaluate capacity scaling:

| Workload ID | Name & Objective | Total Orders ($N$) | Concurrency (Workers) | Target Offered Rate | Duration (Est.) | Safety Cap / Constraints |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **WL-01** | **Baseline Smoke Test**<br>Verify clean roundtrip & low load | 1,000 | 5 | ~500 req/s | ~2.0s | Max 10MB heap. Safe for quick validation. |
| **WL-02** | **Light Load Baseline**<br>Normal operating threshold | 10,000 | 10 | ~2,000 req/s | ~5.0s | Max 20MB heap. Monitored for dial errors. |
| **WL-03** | **Moderate Ingestion Stress**<br>Crosses DB insert threshold | 50,000 | 25 | ~5,000 req/s | ~10.0s | Redis backlog expected (~38,000 items). |
| **WL-04** | **High Throughput Saturation**<br>Tests socket & pool limits | 100,000 | 50 | ~10,000 req/s | ~10.0s | Severe socket dial churn; Redis backlog. |
| **WL-05** | **Bounded Maximum Capacity**<br>Ceiling for memory safety | 500,000 | 100 | ~15,000 req/s | ~35.0s | **SAFETY CEILING.** Channel preallocation = ~72MB heap. Do not exceed. |

---

## 4. Deterministic Seeding & Test Repeatability

To guarantee that performance runs across different stages are directly comparable:
1. **RNG Seed**: All runs specify a fixed seed (`seed = 133742`).
2. **Deterministic Persona Array**: With a fixed seed, `GenerateDeterministicPersonaMix` produces an identical sequence of orders across all test iterations.
3. **Symbol Universe**: Restricted to the 4 standard symbols: `AAPL`, `MSFT`, `TSLA`, `AMZN`.
4. **Pre-Run Warmup**: Every run includes the mandatory 5-second warmup period enforced by `bot-worker` (`main.go:227`), stabilizing TCP connection buffers and JIT runtime caches before measurement begins.

---

## 5. Environmental Safety Rules & Circuit Breakers

To avoid host system instability or unrecoverable lockups:
1. **Workload Ceiling Cap**: Never submit a single benchmark exceeding $N=500,000$ requests. Sizing channels to $N > 1,000,000$ allocates >145MB heap and risks kernel OOM termination (BF-P4-004).
2. **Drainage Synchronization**: After completing any workload exceeding $N=10,000$, allow a mandatory **30 to 60 second cooling period** for `telemetry-service` to drain pending Redis Stream entries into PostgreSQL before starting the next test.
3. **Connection Throttle**: Limit worker concurrency to $\le 100$ goroutines to avoid exhausting the Windows ephemeral TCP port range (49152–65535).
