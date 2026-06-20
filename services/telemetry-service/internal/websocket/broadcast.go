package websocket

// Broadcast sends a message to all clients in a specific benchmark room.
func (h *Hub) Broadcast(benchmarkID string, message []byte) {
	h.BroadcastChan <- BroadcastMessage{
		BenchmarkID: benchmarkID,
		Payload:     message,
	}
}