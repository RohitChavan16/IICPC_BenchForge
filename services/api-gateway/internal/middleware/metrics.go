package middleware

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/metrics"
)

func PrometheusMetrics() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		
		c.Next()

		duration := time.Since(start).Seconds()
		status := strconv.Itoa(c.Writer.Status())
		
		metrics.HttpRequestsTotal.WithLabelValues(c.Request.Method, c.Request.URL.Path, status).Inc()
		metrics.HttpRequestDuration.WithLabelValues(c.Request.Method, c.Request.URL.Path).Observe(duration)
	}
}

