FROM golang:1.26-alpine

WORKDIR /app

COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

RUN go build -o api-gateway ./cmd/server

EXPOSE 8080

CMD ["./api-gateway"]