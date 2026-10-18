# BenchForge Phase 1 Forensic Audit — Index

**Date:** 2026-10-17  
**Type:** Read-only forensic audit — no production files modified  
**Scope:** Full repository at `e:\AIML_Projects\iicpc_benchforge`

## Reports

| File | Description |
|---|---|
| [01-executive-summary.md](./01-executive-summary.md) | What the system is, major findings, confidence levels |
| [03-service-inventory.md](./03-service-inventory.md) | All 9 services: routes, dependencies, status, evidence |
| [06-benchmark-lifecycle.md](./06-benchmark-lifecycle.md) | Complete benchmark flow traced step-by-step through source |
| [08-tests-and-baseline.md](./08-tests-and-baseline.md) | Build results, test results, coverage gaps |
| [09-claims-verification.md](./09-claims-verification.md) | 34 README claims verified against source code |
| [10-findings-register.md](./10-findings-register.md) | 21 findings with severity, evidence, file:line citations |
| [10b-additional-findings.md](./10b-additional-findings.md) | 12 additional findings from deep subagent inspection |
| [11-phase-2-handoff.md](./11-phase-2-handoff.md) | 10 priority questions for Phase 2 correctness investigation |
| [diagrams/architecture.mmd](./diagrams/architecture.mmd) | Verified architecture diagram (Mermaid) |

## Build Status Summary

| Service | Build | Tests |
|---|---|---|
| api-gateway | ✅ PASS | None |
| benchmark-service | ✅ PASS | None |
| bot-worker | ✅ PASS | ✅ 4 PASS |
| telemetry-service | ✅ PASS | recovery_test.go |
| mock-exchange | ❌ COMPILATION ERROR | None |
| submission-service | ❌ COMPILATION ERROR | None |
| container-runner | Not verified | None |
| deployment-service | Not verified | None |
| leaderboard-service | Not verified | None |

## Top 8 Critical Findings

1. **BF-P1-022** — All 9 Dockerfiles reference `golang:1.26-alpine` (doesn't exist) — platform cannot be deployed
2. **BF-P1-023** — No migration runner — database tables never created on fresh install
3. **BF-P1-024** — Contestant containers placed on internal Docker network (can reach Redis + Postgres)
4. **BF-P1-025** — `.env` file with real `WORKER_SECRET` committed to git
5. **BF-P1-001** — `checkCorrectnessStub` always returns true for 2xx — non-tracer correctness not validated
6. **BF-P1-002** — Zip path traversal vulnerability in container-runner
7. **BF-P1-010** — mock-exchange has compilation errors
8. **BF-P1-011** — submission-service has compilation errors

## What Is Verified to Work

- ✅ Scoring formula implemented correctly in Go (though underdocumented)
- ✅ Redis Streams at-least-once delivery logic (code is correct)
- ✅ Tracer persona correctness scenarios (tests pass)
- ✅ 20-bucket Postgres window function replay query
- ✅ JWT auth middleware with algorithm check
- ✅ Leaderboard ON CONFLICT best-score-wins upsert
- ✅ Tie-breaking cascade SQL
- ✅ DLQ implementation for failed metric ingestion
- ✅ 1Hz WebSocket broadcast architecture

## What Does NOT Work / Is Not Implemented

- ❌ Platform cannot be deployed (`golang:1.26` doesn't exist)
- ❌ Database is empty without a migration runner
- ❌ mock-exchange returns `{"status":"accepted"}` — not a matching engine
- ❌ Non-tracer bot correctness validation is a stub
- ❌ Replay TPS values are fabricated (`count * 2`)
- ❌ Admin dashboards show hardcoded mock data
- ❌ `/logs`, `/notifications` API calls return 404 silently
- ❌ Prometheus scrapes zero microservices
- ❌ Grafana has no mounted dashboards
- ❌ kubernetes/ and docker/ deployment directories are empty
