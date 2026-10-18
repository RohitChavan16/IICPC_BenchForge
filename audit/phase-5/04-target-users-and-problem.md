# BenchForge Phase 5 — Target Users & Problem Identification

**Audit Date:** 2026-10-17  
**Scope:** Disaggregated customer segment evaluation, problem-solution fit, willingness-to-pay dynamics, and adoption barriers.  
**Auditor:** Independent Developer-Tools Market Researcher & Technical Product Strategist (Phase 5)

---

## 1. Disaggregated Segment Evaluation

We rigorously evaluate six candidate user segments independently. We do not assume aggregate demand or infer willingness to pay simply because an engineering challenge exists.

```mermaid
quadrantChart
    title User Pain vs. Technical Defensibility
    x-axis Low Willingness to Pay --> High Willingness to Pay
    y-axis Low Custom Fit --> High Custom Fit
    quadrant-1 Commercial Sweet Spot (Difficult)
    quadrant-2 Open Source / Hackathon Fit
    quadrant-3 Irrelevant / Low Utility
    quadrant-4 Existing Enterprise Tool Dominance
    "Students & Indie Devs": [0.15, 0.45]
    "Hackathon Organizers": [0.35, 0.85]
    "University Research Labs": [0.30, 0.65]
    "OSS Engine Maintainers": [0.20, 0.70]
    "Fintech Teams / Startups": [0.75, 0.35]
    "HFT / Quant Desks": [0.95, 0.10]
```

---

### Segment 1: Trading-Engine Hackathon & Competition Organizers
*e.g. University algorithmic trading clubs, corporate hackathons (Jane Street, Citadel, Optiver campus challenges).*

1. **Job to be Done**: Collect 50–200 student-built order matching engines, automatically compile and execute them against standardized benchmark traffic, rank them fairly on a public leaderboard, and crown a winner based on correctness and latency.
2. **Current Workflow**: Custom Bash/Python scripts running in GitHub Actions or a single AWS EC2 instance; manual spreadsheet collation; basic unit tests for grading.
3. **Frequency**: Periodic (1–2 events per year).
4. **Consequences of Failure**: Public embarrassment, student protests over unfair rankings, or malicious student code wiping the grading VM.
5. **Existing Tools**: GitHub Classroom, HackerRank, Custom Python test harnesses, Google Forms.
6. **Buyer vs. Operator vs. End User**:
   - *Buyer*: Student club president or corporate sponsor (sponsorship budget $500–$2,500).
   - *Operator*: Event technical lead (wants zero setup friction, single Docker container or hosted web app).
   - *End User*: Student contestant submitting code.
7. **Adoption Barriers & Required Trust**:
   - **Severe**: Currently blocked by root host escape (BF-P3-004), database network exposure (BF-P1-024), and cheating vulnerabilities (BF-P2-001). Furthermore, the hardcoded single-benchmark queue limit (`MAX_CONCURRENT_BENCHMARKS = 1`, BF-P4-006) means an event with 50 submissions faces an unworkable 25+ minute queue backlog.
8. **Evidence of Need**: Observed in campus trading competitions where organizers struggle to build automated real-time leaderboards with visual appeal.
9. **Remaining Assumptions**: Whether organizers will deploy a complex 9-service cluster vs. using a simple 100-line Python grading script.

---

### Segment 2: Students & Independent Developers Building Engines
*e.g. CS students taking systems/distributed courses, self-taught engineers building trading portfolio projects.*

1. **Job to be Done**: Verify that their personal matching engine correctly enforces FIFO Price-Time Priority and measure how many orders per second it can process on their laptop.
2. **Current Workflow**: Writing Go/C++/Rust unit tests with the standard testing library (`go test -bench`, `cargo bench`, Google Benchmark).
3. **Frequency**: Frequent during project development (daily for 2–4 weeks), then stops completely once the project is finished.
4. **Consequences of Failure**: Poor project grade or unoptimized code on their GitHub resume.
5. **Existing Tools**: Language-native unit benchmarks, `wrk`, `hey`, `k6`.
6. **Buyer vs. Operator vs. End User**: All identical (the solo developer).
7. **Adoption Barriers & Required Trust**:
   - **Prohibitive**: A solo developer will not spin up 9 microservices, PostgreSQL, and Redis just to benchmark an engine on `localhost`. They want a CLI tool (`benchforge run ./my_engine`).
8. **Evidence of Need**: Abundant open-source matching engine projects on GitHub, but none deploy external microservice platforms for local benchmarking.
9. **Remaining Assumptions**: Assumption that an indie dev cares about real-time WebSocket charts more than raw nanosecond benchmark output.

---

### Segment 3: University Trading & Systems Research Groups
*e.g. Academic labs researching market microstructure, FPGA matching logic, or concurrency algorithms.*

1. **Job to be Done**: Run rigorous, repeatable comparative benchmarks between novel matching algorithms under synthetic and empirical order flows.
2. **Current Workflow**: Highly specialized academic testbeds (often C++ with DPDK or custom kernel bypass networking), historical market data PCAP replay.
3. **Frequency**: Continuous during research cycles.
4. **Consequences of Failure**: Paper rejection by peer reviewers due to non-reproducible benchmarks or measurement artifacts.
5. **Existing Tools**: Custom C++ harness, hardware packet generators, historical tick data simulators.
6. **Buyer vs. Operator vs. End User**: Lab Professor (Grant buyer), PhD candidate / postdoc (Operator/User).
7. **Adoption Barriers & Required Trust**:
   - **Fatal**: Academics require microsecond/nanosecond rigor. BenchForge's 1ms integer quantization (BF-P4-001), 1,000,000x unit discrepancy (BF-P2-003), and hardcoded replay math (BF-P2-005) immediately disqualify it from scientific credibility.
8. **Evidence of Need**: Systems researchers require benchmarking, but reject black-box HTTP-based microservice harnesses with millisecond resolution.
9. **Remaining Assumptions**: None — academic disqualification is directly substantiated by metric truncation.

---

### Segment 4: Open-Source Exchange-Engine Maintainers
*e.g. Authors of engines like `exchange-core`, `liquibook`, or custom Rust matching engines.*

1. **Job to be Done**: Continuous performance regression testing in CI on every pull request to ensure commits do not degrade throughput or alter fill logic.
2. **Current Workflow**: GitHub Actions running native benchmark suites (JMH, Criterion, Google Benchmark) outputting markdown summary tables.
3. **Frequency**: Continuous on Git push/PR.
4. **Consequences of Failure**: Silent performance regressions merged into main branch.
5. **Existing Tools**: GitHub Actions + Criterion / JMH / Continuous Benchmarking bots (e.g. Bencher.dev).
6. **Buyer vs. Operator vs. End User**: Open-source maintainer (volunteer, zero budget).
7. **Adoption Barriers & Required Trust**:
   - **Fatal**: Cannot integrate into standard GitHub Actions without running a full 9-service Docker Compose cluster. Furthermore, the 1,200 TPS throughput ceiling (BF-P4-003) is completely insufficient for engines like `liquibook` or `exchange-core`, which process 2,000,000+ orders/second in-memory.
8. **Evidence of Need**: Maintainers actively use benchmarking, but rely on in-process memory benchmarks, not REST HTTP wrappers.
9. **Remaining Assumptions**: None.

---

### Segment 5: Small Fintech Teams & Crypto Exchanges
*e.g. Early-stage prop desks, decentralized exchange (DEX) off-chain matchers, retail brokerages.*

1. **Job to be Done**: Pre-production integration testing, capacity planning, and regulatory compliance verification for matching engine microservices.
2. **Current Workflow**: Dedicated QA environments using Gatling, k6, or custom Python FIX/WebSocket load drivers connected to enterprise Grafana/Datadog dashboards.
3. **Frequency**: Weekly/bi-weekly during release cycles.
4. **Consequences of Failure**: Production exchange outages, regulatory fines, financial loss from double-fills or book desynchronization.
5. **Existing Tools**: k6, Gatling, JMeter, custom FIX protocol generators, Datadog.
6. **Buyer vs. Operator vs. End User**:
   - *Buyer*: VP of Engineering / Head of QA ($5,000–$25,000 annual tooling budget).
   - *Operator*: QA / Performance Engineer.
   - *End User*: Backend exchange engineers.
7. **Adoption Barriers & Required Trust**:
   - **Commercial Non-Starter**: Commercial exchanges do not use REST HTTP for order placement; they use FIX (Financial Information eXchange), binary protocols (ITCH/OUCH), or WebSockets. BenchForge only supports HTTP POST `/order` with limit orders (BF-P2-008). It lacks FIX protocol, market orders, order cancellations, and account balance tracking.
8. **Evidence of Need**: Commercial fintechs have budget, but BenchForge lacks the foundational protocols (FIX/ITCH/OUCH) they require.
9. **Remaining Assumptions**: Assumption that an enterprise would trust an unvetted open-source engine evaluator over k6 Enterprise.

---

### Segment 6: Tier-1 Quantitative Trading Firms & HFT Desks
*e.g. Jane Street, Citadel Securities, Jump Trading, Optiver, Hudson River Trading.*

1. **Job to be Done**: Sub-microsecond latency profiling of custom FPGA/kernel-bypass matching hardware and software.
2. **Current Workflow**: Hardware timestamping NICs (Solarflare/AMD Xilinx), fiber-optic taps, nanosecond PTP clock synchronization, dedicated bare-metal FPGA labs.
3. **Frequency**: 24/7 continuous simulation.
4. **Consequences of Failure**: Millions of dollars lost per microsecond of latency slippage.
5. **Existing Tools**: In-house proprietary hardware and software harnesses costing millions of dollars.
6. **Buyer vs. Operator vs. End User**: Internal infrastructure leadership.
7. **Adoption Barriers & Required Trust**:
   - **Absolute Rejection**: The idea of testing an HFT trading engine over Dockerized HTTP REST on a Windows/Linux shared network with 1ms integer rounding is an engineering absurdity in this domain.
8. **Evidence of Need**: Zero overlap with BenchForge's architectural reality.
9. **Remaining Assumptions**: None.

---

## 2. Segment Comparison Matrix

| Evaluation Dimension | Hackathon Organizers | Students / Indie Devs | University Research | OSS Maintainers | Fintech Startups | Tier-1 HFT Desks |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Pain Intensity** | **High** | Medium | High | High | High | Critical |
| **Current Workflow Pain** | Fragmented scripts | Clunky CLI | High setup | Basic charts | Custom scripts | Continuous build |
| **Budget / Willingness to Pay** | Low ($200–$1,000) | Zero | Low / Grants | Zero | Medium ($5k–$20k) | Unlimited (In-house) |
| **Protocol Fit (HTTP POST)** | **100% Fit** | **100% Fit** | 20% Fit | 10% Fit | 20% Fit (Needs FIX) | 0% (Needs ITCH/OUCH) |
| **Metric Resolution Fit** | **Acceptable (ms)** | **Acceptable (ms)** | Unacceptable (ns) | Unacceptable (ns) | Unacceptable (µs) | Unacceptable (ns) |
| **Setup Friction Tolerance** | **Low (Needs Turnkey)**| Low (Needs CLI) | Medium | Very Low (Needs CI) | Medium | Very Low |
| **Current Blocker Severity** | Critical (Security/Queue)| High (Too heavy) | Fatal (Precision) | Fatal (Throughput) | Fatal (Protocols) | Fatal (Architecture) |

---

## 3. The Narrowest Credible Initial User Segment

### Selected Segment: **Trading-Engine Hackathon & Collegiate Competition Organizers**

#### Why this is the ONLY viable segment:
1. **Protocol Alignment**: Collegiate hackathons specifically constrain student submissions to simple HTTP REST interfaces (`POST /order`) to keep assignments accessible across Go, Rust, Python, and C++.
2. **Latency Tolerance**: In an educational contest, ranking engines between 5ms and 50ms is meaningful; sub-microsecond hardware fidelity is not required.
3. **Visual Value**: The live WebSocket dashboard, 20-bucket replay scrubber, and animated leaderboard deliver genuine excitement and high emotional value to participants and judges during a live demo or presentation.
4. **Alternatives are Weak**: There is no off-the-shelf, free hackathon platform specifically designed for algorithmic trading engine battles. Organizers currently cobble together broken Python scripts.

#### Critical Caveats & Non-Negotiables:
This segment is only viable if BenchForge is:
1. Hardened against host takeover and cheater exploits (BF-P3-004, BF-P2-001).
2. Repackaged so organizers do not have to debug 9 separate microservices and manual SQL migrations.
3. Unblocked from the 1-benchmark global queue bottleneck (`MAX_CONCURRENT_BENCHMARKS = 1`, BF-P4-006).
