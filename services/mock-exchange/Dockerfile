FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

RUN go build -o mock-exchange ./cmd/server

# =========================

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/mock-exchange .

EXPOSE 9000

CMD ["./mock-exchange"]