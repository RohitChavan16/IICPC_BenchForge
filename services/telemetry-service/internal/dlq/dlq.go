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
			http.Error(w, "Failed to read DLQ", http.StatusInternalServerError)
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
			http.Error(w, "Missing ID", http.StatusBadRequest)
			return
		}

		// Get the message
		streams, err := rdb.XRange(context.Background(), "telemetry_dlq", id, id).Result()
		if err != nil || len(streams) == 0 {
			http.Error(w, "Message not found", http.StatusNotFound)
			return
		}

		payloadStr, _ := streams[0].Values["payload"].(string)
		var payloadData map[string]interface{}
		json.Unmarshal([]byte(payloadStr), &payloadData)
		
		originalEvent, ok := payloadData["original_event"].(string)
		if !ok {
			http.Error(w, "Invalid payload format", http.StatusInternalServerError)
			return
		}

		// Re-insert into telemetry_stream
		err = rdb.XAdd(context.Background(), &redis.XAddArgs{
			Stream: consumer.StreamName,
			Values: map[string]interface{}{"metric": originalEvent},
		}).Err()

		if err != nil {
			http.Error(w, "Failed to replay message", http.StatusInternalServerError)
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
			http.Error(w, "Missing ID", http.StatusBadRequest)
			return
		}

		rdb.XDel(context.Background(), "telemetry_dlq", id)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Discarded"))
	}
}

