package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/logger"
)

func CorrelationID() gin.HandlerFunc {
	return func(c *gin.Context) {
		traceID := c.GetHeader("X-Trace-Id")
		if traceID == "" {
			traceID = uuid.NewString()
		}

		c.Set("trace_id", traceID)
		c.Writer.Header().Set("X-Trace-Id", traceID)
		c.Request.Header.Set("X-Trace-Id", traceID)

		logger.Log.Info("Incoming HTTP Request",
			"trace_id", traceID,
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
		)

		c.Next()
	}
}

