package websocket

func Broadcast(message []byte) {

	for client := range clients {
		client.WriteMessage(1, message)
	}
}