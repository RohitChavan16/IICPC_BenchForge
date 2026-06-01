package routes

import (
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"

	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/auth"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/handlers"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/middleware"
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

func proxyToLeaderboard(c *gin.Context) {
	target, _ := url.Parse("http://leaderboard-service:8084")
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ServeHTTP(c.Writer, c.Request)
}

func proxyToSubmission(c *gin.Context) {
	target, _ := url.Parse("http://submission-service:8083")
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ServeHTTP(c.Writer, c.Request)
}

func SetupRoutes(router *gin.Engine, authHandler *auth.AuthHandler, authMiddleware *middleware.AuthMiddleware) {
	router.GET("/health", handlers.HealthCheck)

	router.POST("/auth/register", authHandler.Register)
	router.POST("/auth/login", authHandler.Login)
	router.GET("/auth/me", authHandler.Me)

	// Contestant/User routes (Require Auth)
	protected := router.Group("/")
	protected.Use(authMiddleware.RequireAuth())
	{
		protected.Any("/benchmarks", func(c *gin.Context) { proxyToBenchmark(c) })
		protected.Any("/benchmarks/*proxyPath", func(c *gin.Context) { proxyToBenchmark(c) })

		protected.Any("/submissions", func(c *gin.Context) { proxyToSubmission(c) })
		protected.Any("/submissions/*proxyPath", func(c *gin.Context) { proxyToSubmission(c) })
	}

	// Public or Authenticated
	router.Any("/leaderboard", func(c *gin.Context) { proxyToLeaderboard(c) })
	router.Any("/leaderboard/*proxyPath", func(c *gin.Context) { proxyToLeaderboard(c) })

	// Admin routes
	admin := router.Group("/")
	admin.Use(authMiddleware.RequireAuth(), authMiddleware.RequireRole("admin"))
	{
		admin.Any("/workers", func(c *gin.Context) { proxyToTelemetry(c) })
		admin.Any("/workers/*proxyPath", func(c *gin.Context) { proxyToTelemetry(c) })
		
		admin.Any("/telemetry", func(c *gin.Context) { proxyToTelemetry(c) })
		admin.Any("/telemetry/*proxyPath", func(c *gin.Context) { proxyToTelemetry(c) })
	}
}
