package middleware

import (
	"net/http"
	"time"

	"github.com/RohitChavan16/IICPC_BenchForge/services/mock-exchange/internal/logger"
	"github.com/RohitChavan16/IICPC_BenchForge/services/mock-exchange/internal/metrics"
)

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func LoggingMiddleware(next http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		start := time.Now()
        metrics.ActiveRequests.Inc()
        defer metrics.ActiveRequests.Dec()
		rw := &responseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		next.ServeHTTP(rw, r)

		latency := time.Since(start)
         metrics.HTTPRequestCounter.WithLabelValues(
	r.Method,
	r.URL.Path,
	http.StatusText(rw.statusCode),
).Inc()

metrics.HTTPRequestDuration.WithLabelValues(
	r.Method,
	r.URL.Path,
).Observe(latency.Seconds())
		requestID := r.Context().Value(RequestIDKey)

		if rw.statusCode >= 400 {

	logger.Log.Error(
		"HTTP request failed",
		"request_id", requestID,
		"method", r.Method,
		"path", r.URL.Path,
		"status", rw.statusCode,
		"latency_ms", latency.Milliseconds(),
	)

} else {

	logger.Log.Debug(
		"HTTP request",
		"request_id", requestID,
		"method", r.Method,
		"path", r.URL.Path,
		"status", rw.statusCode,
		"latency_ms", latency.Milliseconds(),
	)
}
	})
}