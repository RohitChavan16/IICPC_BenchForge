package routes

import (
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"

	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/auth"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/handlers"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/middleware"
)

func proxyToBenchmark(c *gin.Context) {
	otel.GetTextMapPropagator().Inject(c.Request.Context(), propagation.HeaderCarrier(c.Request.Header))
	target, _ := url.Parse("http://benchmark-service:8082")
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ServeHTTP(c.Writer, c.Request)
}

func proxyToTelemetry(c *gin.Context) {
	otel.GetTextMapPropagator().Inject(c.Request.Context(), propagation.HeaderCarrier(c.Request.Header))
	target, _ := url.Parse("http://telemetry-service:8081")
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ServeHTTP(c.Writer, c.Request)
}

func proxyToLeaderboard(c *gin.Context) {
	otel.GetTextMapPropagator().Inject(c.Request.Context(), propagation.HeaderCarrier(c.Request.Header))
	target, _ := url.Parse("http://leaderboard-service:8084")
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ServeHTTP(c.Writer, c.Request)
}

func proxyToSubmission(c *gin.Context) {
	otel.GetTextMapPropagator().Inject(c.Request.Context(), propagation.HeaderCarrier(c.Request.Header))
	target, _ := url.Parse("http://submission-service:8083")
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ServeHTTP(c.Writer, c.Request)
}

func proxyToDeployment(c *gin.Context) {
	otel.GetTextMapPropagator().Inject(c.Request.Context(), propagation.HeaderCarrier(c.Request.Header))
	target, _ := url.Parse("http://deployment-service:8091")
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ServeHTTP(c.Writer, c.Request)
}

func SetupRoutes(router *gin.Engine, authHandler *auth.AuthHandler, authMiddleware *middleware.AuthMiddleware) {
	router.GET("/health", handlers.HealthCheck)

	router.POST("/auth/register", authHandler.Register)
	router.POST("/auth/login", authHandler.Login)
	router.POST("/auth/logout", authHandler.Logout)
	router.GET("/auth/me", authHandler.Me)

	// Contestant/User routes (Require Auth)
	protected := router.Group("/")
	protected.Use(authMiddleware.RequireAuth())
	{
		protected.Any("/benchmarks", func(c *gin.Context) { proxyToBenchmark(c) })
		protected.Any("/benchmarks/*proxyPath", func(c *gin.Context) { proxyToBenchmark(c) })

		protected.Any("/submissions", func(c *gin.Context) { proxyToSubmission(c) })
		protected.Any("/submissions/*proxyPath", func(c *gin.Context) { proxyToSubmission(c) })

		protected.Any("/deployments", func(c *gin.Context) { proxyToDeployment(c) })
		protected.Any("/deployments/*proxyPath", func(c *gin.Context) { proxyToDeployment(c) })

		protected.Any("/history", func(c *gin.Context) { proxyToTelemetry(c) })

		protected.Any("/personas", func(c *gin.Context) { proxyToTelemetry(c) })
		protected.Any("/personas/*proxyPath", func(c *gin.Context) { proxyToTelemetry(c) })

		protected.Any("/replay", func(c *gin.Context) { proxyToTelemetry(c) })
		protected.Any("/replay/*proxyPath", func(c *gin.Context) { proxyToTelemetry(c) })
		
		protected.POST("/ticket", func(c *gin.Context) { proxyToTelemetry(c) })
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
		
		admin.Any("/infrastructure", func(c *gin.Context) { proxyToTelemetry(c) })
		admin.Any("/infrastructure/*proxyPath", func(c *gin.Context) { proxyToTelemetry(c) })
	}
}
