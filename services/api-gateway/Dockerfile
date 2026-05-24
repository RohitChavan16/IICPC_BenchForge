FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

RUN go build -o api-gateway ./cmd/server

# ======================

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/api-gateway .

EXPOSE 8080

CMD ["./api-gateway"]