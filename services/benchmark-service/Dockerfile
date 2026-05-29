FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

RUN go build -o benchmark-service ./cmd/server

# ======================

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/benchmark-service .

EXPOSE 8080

CMD ["./benchmark-service"]