package websocket

import (
	"sync"
)

type Hub struct {
	// Registered clients organized by benchmark room.
	Rooms map[string]map[*Client]bool

	// Inbound messages from the clients.
	BroadcastChan chan BroadcastMessage

	// Register requests from the clients.
	Register chan *Client

	// Unregister requests from clients.
	Unregister chan *Client

	mu sync.RWMutex
}

type BroadcastMessage struct {
	BenchmarkID string
	Payload     []byte
}

func NewHub() *Hub {
	return &Hub{
		Rooms:         make(map[string]map[*Client]bool),
		BroadcastChan: make(chan BroadcastMessage),
		Register:      make(chan *Client),
		Unregister:    make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			if h.Rooms[client.BenchmarkID] == nil {
				h.Rooms[client.BenchmarkID] = make(map[*Client]bool)
			}
			h.Rooms[client.BenchmarkID][client] = true
			h.mu.Unlock()

		case client := <-h.Unregister:
			h.mu.Lock()
			if room, ok := h.Rooms[client.BenchmarkID]; ok {
				if _, ok := room[client]; ok {
					delete(room, client)
					close(client.Send)
					if len(room) == 0 {
						delete(h.Rooms, client.BenchmarkID)
					}
				}
			}
			h.mu.Unlock()

		case message := <-h.BroadcastChan:
			h.mu.RLock()
			if room, ok := h.Rooms[message.BenchmarkID]; ok {
				for client := range room {
					select {
					case client.Send <- message.Payload:
					default:
						// If the client's send buffer is full, disconnect them (slow consumer)
						close(client.Send)
						delete(room, client)
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}