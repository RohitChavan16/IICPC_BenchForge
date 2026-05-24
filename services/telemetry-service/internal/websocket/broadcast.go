package websocket

import (
	"log"

	"github.com/gorilla/websocket"
)

func (h *Hub) Broadcast(
	message []byte,
) {

	h.mu.Lock()
	defer h.mu.Unlock()

	for client := range h.clients {

		err := client.WriteMessage(
			websocket.TextMessage,
			message,
		)

		if err != nil {

			log.Println(err)

			client.Close()

			delete(h.clients, client)
		}
	}
}