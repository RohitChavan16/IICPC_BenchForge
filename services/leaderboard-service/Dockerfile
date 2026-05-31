FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

RUN go build -o leaderboard-service ./cmd/server

# ======================

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/leaderboard-service .

EXPOSE 8084

CMD ["./leaderboard-service"]
