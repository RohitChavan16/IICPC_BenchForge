FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod .
COPY go.sum .

RUN go mod download || true

COPY . .

RUN go build -o container-runner ./cmd/server

FROM alpine:latest

RUN apk add --no-cache docker-cli

WORKDIR /root/

COPY --from=builder /app/container-runner .

EXPOSE 8090

CMD ["./container-runner"]