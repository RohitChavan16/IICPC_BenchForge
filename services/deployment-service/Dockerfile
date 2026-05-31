FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod .
COPY go.sum .
RUN go mod download || true

COPY . .

RUN go build -o deployment-service ./cmd/server

FROM alpine:latest
RUN apk add --no-cache docker-cli
WORKDIR /root/
COPY --from=builder /app/deployment-service .
EXPOSE 8091
CMD ["./deployment-service"]
