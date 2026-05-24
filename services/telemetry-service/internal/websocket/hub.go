package websocket

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type Hub struct {
	mu      sync.Mutex
	clients map[*websocket.Conn]bool
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[*websocket.Conn]bool),
	}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h *Hub) HandleConnections(
	w http.ResponseWriter,
	r *http.Request,
) {

	conn, err := upgrader.Upgrade(
		w,
		r,
		nil,
	)

	if err != nil {
		return
	}

	h.mu.Lock()
	h.clients[conn] = true
	h.mu.Unlock()

	log.Println("WebSocket client connected")
}