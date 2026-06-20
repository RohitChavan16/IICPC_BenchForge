package middleware

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/metrics"
)

type responseWriter struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func (rw *responseWriter) WriteHeader(code int) {
	if rw.wroteHeader {
		return
	}
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
	rw.wroteHeader = true
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	if !rw.wroteHeader {
		rw.WriteHeader(http.StatusOK)
	}
	return rw.ResponseWriter.Write(b)
}

func PrometheusMetrics(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rw, r)

		duration := time.Since(start).Seconds()
		
		route := mux.CurrentRoute(r)
		path, _ := route.GetPathTemplate()
		if path == "" {
			path = r.URL.Path
		}
		
		metrics.HttpRequestsTotal.WithLabelValues(r.Method, path, strconv.Itoa(rw.status)).Inc()
		metrics.HttpRequestDuration.WithLabelValues(r.Method, path).Observe(duration)
	})
}

