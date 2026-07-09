package middleware

import (
	"log"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("[Recovery] panic recovered: %s %s\n%v\n%s", c.Request.Method, c.Request.URL.Path, err, debug.Stack())
				
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"error":   "Internal Server Error",
				})
			}
		}()
		c.Next()
	}
}
