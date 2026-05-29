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

func SetupRoutes(router *gin.Engine) {
	router.GET("/health", handlers.HealthCheck)

	// Proxy benchmark-related API calls to benchmark-service
	router.Any("/benchmarks", func(c *gin.Context) { proxyToBenchmark(c) })
	router.Any("/benchmarks/*proxyPath", func(c *gin.Context) { proxyToBenchmark(c) })
}
