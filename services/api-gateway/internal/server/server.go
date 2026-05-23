package server

import (
	"fmt"

	"github.com/gin-gonic/gin"

	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/routes"
)

func NewServer(port string) *gin.Engine {
	router := gin.Default()

	routes.SetupRoutes(router)

	fmt.Println("API Gateway running on port:", port)

	return router
}