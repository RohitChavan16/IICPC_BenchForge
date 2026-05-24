FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

RUN go build -o bot-worker ./cmd/worker

# ======================

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/bot-worker .

EXPOSE 8080

CMD ["./bot-worker"]