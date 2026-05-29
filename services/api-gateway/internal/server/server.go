package server

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/routes"
)

func NewServer(port string) *gin.Engine {
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

	routes.SetupRoutes(router)

	fmt.Println("API Gateway running on port:", port)

	return router
}
