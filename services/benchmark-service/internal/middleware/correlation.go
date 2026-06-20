package middleware

import (
	"net/http"
	"github.com/google/uuid"
	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/logger"
)

func CorrelationID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		traceID := r.Header.Get("X-Trace-Id")
		if traceID == "" {
			traceID = uuid.NewString()
		}

		w.Header().Set("X-Trace-Id", traceID)

		logger.Log.Info("Incoming HTTP Request",
			"trace_id", traceID,
			"method", r.Method,
			"path", r.URL.Path,
		)

		next.ServeHTTP(w, r)
	})
}

