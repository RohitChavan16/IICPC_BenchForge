package dlq

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/redis/go-redis/v9"
	"github.com/RohitChavan16/IICPC_BenchForge/services/telemetry-service/internal/consumer"
)

type DLQMessage struct {
	ID      string `json:"id"`
	Payload string `json:"payload"`
}

func ListHandler(rdb *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		streams, err := rdb.XRead(context.Background(), &redis.XReadArgs{
			Streams: []string{"telemetry_dlq", "0-0"},
			Count:   100,
		}).Result()

		if err != nil && err != redis.Nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"error": "Failed to read DLQ", "status": http.StatusInternalServerError})
			return
		}

		var messages []DLQMessage
		if len(streams) > 0 {
			for _, msg := range streams[0].Messages {
				payload, _ := msg.Values["payload"].(string)
				messages = append(messages, DLQMessage{
					ID:      msg.ID,
					Payload: payload,
				})
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(messages)
	}
}

func ReplayHandler(rdb *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimPrefix(r.URL.Path, "/api/dlq/")
		id = strings.TrimSuffix(id, "/replay")
		if id == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{"error": "Missing ID", "status": http.StatusBadRequest})
			return
		}

		// Get the message
		streams, err := rdb.XRange(context.Background(), "telemetry_dlq", id, id).Result()
		if err != nil || len(streams) == 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]interface{}{"error": "Message not found", "status": http.StatusNotFound})
			return
		}

		payloadStr, _ := streams[0].Values["payload"].(string)
		var payloadData map[string]interface{}
		json.Unmarshal([]byte(payloadStr), &payloadData)
		
		originalEvent, ok := payloadData["original_event"].(string)
		if !ok {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"error": "Invalid payload format", "status": http.StatusInternalServerError})
			return
		}

		// Re-insert into telemetry_stream
		err = rdb.XAdd(context.Background(), &redis.XAddArgs{
			Stream: consumer.StreamName,
			Values: map[string]interface{}{"metric": originalEvent},
		}).Err()

		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"error": "Failed to replay message", "status": http.StatusInternalServerError})
			return
		}

		// Delete from DLQ
		rdb.XDel(context.Background(), "telemetry_dlq", id)

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Replayed"))
	}
}

func DiscardHandler(rdb *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimPrefix(r.URL.Path, "/api/dlq/")
		if id == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{"error": "Missing ID", "status": http.StatusBadRequest})
			return
		}

		rdb.XDel(context.Background(), "telemetry_dlq", id)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Discarded"))
	}
}

