# Contributing to BenchForge

First off, thank you for considering contributing to BenchForge! This project represents a serious engineering effort to build robust, distributed telemetry and benchmarking infrastructure. We welcome contributions from engineers across all disciplines.

## 🌟 Project Vision

BenchForge aims to be the gold standard for high-concurrency system benchmarking and observability. We value:
- **Performance First:** Critical load paths must be lock-free, zero-allocation where possible, and highly concurrent.
- **Observability:** Everything must be measurable. If a feature is added, its telemetry must be added.
- **Reliability:** The benchmarking tool cannot be the bottleneck. Robust context handling and graceful degradation are required.

## 💻 Code Standards

We write production-grade Go code.
- Follow standard Go idioms as defined in [Effective Go](https://golang.org/doc/effective_go.html).
- Run `go fmt` and `golangci-lint` before pushing.
- Document exported functions and structs.
- Use structured JSON logging (`slog`) for all service logs. Do not use `fmt.Println` in production paths.
- Ensure all Goroutines are bounded and gracefully handle `context.Done()`.

## 🌿 Branch Strategy

We follow a standard Git Flow:
- `main`: The stable production branch.
- `develop`: The active development branch.
- Feature branches: `feature/<issue-number>-<short-description>`
- Bugfix branches: `bugfix/<issue-number>-<short-description>`

## 📝 Commit Conventions

We enforce [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `test:` Adding missing tests or correcting existing tests

Example: `feat(telemetry): add redis stream consumer group failover`

## 🚀 Pull Request Guidelines

1. **Keep it focused:** Ensure your PR does one thing well.
2. **Include tests:** New features need unit tests and, if applicable, integration tests.
3. **Update documentation:** If you change an API or architecture, update the relevant `docs/*.md`.
4. **Link the issue:** Ensure your PR description links to the issue it resolves (e.g., "Closes #42").

## 🛠️ Development Setup

1. Ensure Docker, Docker Compose, and Go 1.22+ are installed.
2. Run `cp .env.example .env`.
3. Start the infrastructure: `docker compose up --build`.
4. Run `make test` to ensure your local environment is clean.

## 🧪 Testing Expectations

- **Unit Tests:** Business logic and data transformations must be unit tested.
- **Concurrency Tests:** Any code dealing with Goroutines, Channels, or WaitGroups must include race condition testing (`go test -race`).
- **Integration Tests:** Services communicating with Redis or PostgreSQL should have Dockerized integration tests.

## 🔍 Review Process

- All PRs require at least 1 approval from a core maintainer.
- CI/CD must pass (linting, tests, build).
- Reviewers will look for architectural soundness, performance implications, and strict adherence to the code standards.

We look forward to building a world-class benchmarking platform with you!
