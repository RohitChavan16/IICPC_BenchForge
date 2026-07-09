package middleware

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/ratelimit"
)

// RateLimiterConfig holds configuration for the middleware
type RateLimiterConfig struct {
	Enabled  bool
	Requests int
	Window   time.Duration
	Burst    int
}

// RateLimit returns a Gin middleware that limits requests.
// If useAuthUser is true, it attempts to extract the User ID from the X-User-Id header (set by AuthMiddleware).
// Otherwise, it falls back to IP-based rate limiting.
func RateLimit(cfg RateLimiterConfig, useAuthUser bool) gin.HandlerFunc {
	if !cfg.Enabled {
		return func(c *gin.Context) {
			c.Next()
		}
	}

	manager := ratelimit.NewManager(cfg.Requests, cfg.Window, cfg.Burst)

	return func(c *gin.Context) {
		// Bypass health and metrics
		if c.Request.URL.Path == "/health" || c.Request.URL.Path == "/metrics" {
			c.Next()
			return
		}

		var clientID string

		if useAuthUser {
			userID := c.Request.Header.Get("X-User-Id")
			if userID != "" {
				clientID = "user:" + userID
			}
		}

		// Fallback to IP if not authenticated or not required
		if clientID == "" {
			clientID = "ip:" + getClientIP(c.Request)
		}

		limiter := manager.GetLimiter(clientID)

		res := limiter.Reserve()
		if !res.OK() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error":   "Rate limit exceeded",
			})
			return
		}

		delay := res.Delay()
		if delay > 0 {
			res.Cancel() // We don't want to wait, we reject immediately if no tokens are available right now.
			
			// If delay > 0, it means it would need to wait, so the bucket is empty for immediate consumption.
			c.Header("Retry-After", strconv.FormatInt(int64(delay.Seconds()), 10))
			c.Header("X-RateLimit-Limit", strconv.Itoa(manager.GetLimit()))
			c.Header("X-RateLimit-Remaining", "0")
			
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error":   "Rate limit exceeded",
			})
			return
		}

		c.Header("X-RateLimit-Limit", strconv.Itoa(manager.GetLimit()))
		c.Header("X-RateLimit-Remaining", strconv.FormatFloat(limiter.Tokens(), 'f', 0, 64))

		c.Next()
	}
}

func getClientIP(r *http.Request) string {
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		parts := strings.Split(ip, ",")
		return strings.TrimSpace(parts[0])
	}
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	// Fallback to RemoteAddr (strip port)
	remoteAddr := r.RemoteAddr
	if idx := strings.LastIndex(remoteAddr, ":"); idx != -1 {
		return remoteAddr[:idx]
	}
	return remoteAddr
}
