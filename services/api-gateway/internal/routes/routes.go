package routes

import (
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"

	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/auth"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/config"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/handlers"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/middleware"
)

func proxyTo(c *gin.Context, targetURL string) {
	otel.GetTextMapPropagator().Inject(c.Request.Context(), propagation.HeaderCarrier(c.Request.Header))
	target, _ := url.Parse(targetURL)
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ServeHTTP(c.Writer, c.Request)
}

func SetupRoutes(router *gin.Engine, authHandler *auth.AuthHandler, authMiddleware *middleware.AuthMiddleware, cfg *config.Config) {
	router.GET("/health", handlers.HealthCheck)

	rateLimitCfg := middleware.RateLimiterConfig{
		Enabled:  cfg.RateLimitEnabled,
		Requests: cfg.RateLimitRequests,
		Window:   cfg.RateLimitWindow,
		Burst:    cfg.RateLimitBurst,
	}

	ipRateLimiter := middleware.RateLimit(rateLimitCfg, false)
	userRateLimiter := middleware.RateLimit(rateLimitCfg, true)

	authGroup := router.Group("/auth")
	authGroup.Use(ipRateLimiter)
	{
		authGroup.POST("/register", authHandler.Register)
		authGroup.POST("/login", authHandler.Login)
		authGroup.POST("/logout", authHandler.Logout)
		authGroup.GET("/me", authHandler.Me)
	}

	// Contestant/User routes (Require Auth)
	protected := router.Group("/")
	protected.Use(authMiddleware.RequireAuth())
	protected.Use(userRateLimiter)
	{
		protected.Any("/benchmarks", func(c *gin.Context) { proxyTo(c, cfg.BenchmarkServiceURL) })
		protected.Any("/benchmarks/*proxyPath", func(c *gin.Context) { proxyTo(c, cfg.BenchmarkServiceURL) })

		protected.Any("/submissions", func(c *gin.Context) { proxyTo(c, cfg.SubmissionServiceURL) })
		protected.Any("/submissions/*proxyPath", func(c *gin.Context) { proxyTo(c, cfg.SubmissionServiceURL) })

		protected.Any("/deployments", func(c *gin.Context) { proxyTo(c, cfg.DeploymentServiceURL) })
		protected.Any("/deployments/*proxyPath", func(c *gin.Context) { proxyTo(c, cfg.DeploymentServiceURL) })

		protected.Any("/history", func(c *gin.Context) { proxyTo(c, cfg.TelemetryServiceURL) })

		protected.Any("/personas", func(c *gin.Context) { proxyTo(c, cfg.TelemetryServiceURL) })
		protected.Any("/personas/*proxyPath", func(c *gin.Context) { proxyTo(c, cfg.TelemetryServiceURL) })

		protected.Any("/replay", func(c *gin.Context) { proxyTo(c, cfg.TelemetryServiceURL) })
		protected.Any("/replay/*proxyPath", func(c *gin.Context) { proxyTo(c, cfg.TelemetryServiceURL) })
		
		protected.POST("/ticket", func(c *gin.Context) { proxyTo(c, cfg.TelemetryServiceURL) })
	}

	// Public or Authenticated (Rate limit by IP here as it might not be authenticated)
	leaderboard := router.Group("/leaderboard")
	leaderboard.Use(ipRateLimiter)
	{
		leaderboard.Any("", func(c *gin.Context) { proxyTo(c, cfg.LeaderboardServiceURL) })
		leaderboard.Any("/*proxyPath", func(c *gin.Context) { proxyTo(c, cfg.LeaderboardServiceURL) })
	}

	// Admin routes
	admin := router.Group("/")
	admin.Use(authMiddleware.RequireAuth(), authMiddleware.RequireRole("admin"))
	admin.Use(userRateLimiter)
	{
		admin.Any("/workers", func(c *gin.Context) { proxyTo(c, cfg.TelemetryServiceURL) })
		admin.Any("/workers/*proxyPath", func(c *gin.Context) { proxyTo(c, cfg.TelemetryServiceURL) })
		
		admin.Any("/telemetry", func(c *gin.Context) { proxyTo(c, cfg.TelemetryServiceURL) })
		admin.Any("/telemetry/*proxyPath", func(c *gin.Context) { proxyTo(c, cfg.TelemetryServiceURL) })
		
		admin.Any("/infrastructure", func(c *gin.Context) { proxyTo(c, cfg.TelemetryServiceURL) })
		admin.Any("/infrastructure/*proxyPath", func(c *gin.Context) { proxyTo(c, cfg.TelemetryServiceURL) })
	}
}
