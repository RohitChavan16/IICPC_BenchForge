package server

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/auth"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/middleware"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/routes"
)

func NewServer(port string, db *sql.DB, jwtSecret string) *gin.Engine {
	router := gin.Default()
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	authHandler := auth.NewAuthHandler(db, jwtSecret)
	authMiddleware := middleware.NewAuthMiddleware(db, jwtSecret)
	routes.SetupRoutes(router, authHandler, authMiddleware)

	fmt.Println("API Gateway running on port:", port)

	return router
}
