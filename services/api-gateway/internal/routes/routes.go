package routes

import (
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"

	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/handlers"
)

func proxyToBenchmark(c *gin.Context) {
	target, _ := url.Parse("http://benchmark-service:8082")
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ServeHTTP(c.Writer, c.Request)
}

func proxyToTelemetry(c *gin.Context) {
	target, _ := url.Parse("http://telemetry-service:8081")
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ServeHTTP(c.Writer, c.Request)
}

func proxyToSubmission(c *gin.Context) {
	target, _ := url.Parse("http://submission-service:8083")
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ServeHTTP(c.Writer, c.Request)
}

func SetupRoutes(router *gin.Engine) {
	router.GET("/health", handlers.HealthCheck)

	// Proxy benchmark-related API calls to benchmark-service
	router.Any("/benchmarks", func(c *gin.Context) { proxyToBenchmark(c) })
	router.Any("/benchmarks/*proxyPath", func(c *gin.Context) { proxyToBenchmark(c) })

	// Proxy submission-related API calls to submission-service
	router.Any("/submissions", func(c *gin.Context) { proxyToSubmission(c) })
	router.Any("/submissions/*proxyPath", func(c *gin.Context) { proxyToSubmission(c) })

	// Proxy telemetry worker monitoring to telemetry-service.
	router.Any("/workers", func(c *gin.Context) { proxyToTelemetry(c) })
}
