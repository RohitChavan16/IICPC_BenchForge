FROM golang:1.26-alpine AS builder

WORKDIR /app
COPY go.mod ./
COPY main.go ./

RUN go build -o engine main.go

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/engine .

EXPOSE 8080
CMD ["./engine"]
