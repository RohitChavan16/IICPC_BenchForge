package middleware

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/RohitChavan16/IICPC_BenchForge/services/api-gateway/internal/auth"
)

type AuthMiddleware struct {
	db        *sql.DB
	jwtSecret string
}

func NewAuthMiddleware(db *sql.DB, jwtSecret string) *AuthMiddleware {
	if jwtSecret == "" {
		jwtSecret = "benchforge-secret"
	}
	return &AuthMiddleware{db: db, jwtSecret: jwtSecret}
}

func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing or invalid token."})
			return
		}
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return []byte(m.jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token."})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims."})
			return
		}

		userID, ok := claims["sub"].(string)
		if !ok || userID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims."})
			return
		}

		user, err := auth.GetUserByID(m.db, userID)
		if err != nil || user == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token."})
			return
		}

		// Set headers for upstream microservices
		c.Request.Header.Set("X-User-Id", user.ID)
		c.Request.Header.Set("X-Team-Id", user.Team)
		c.Request.Header.Set("X-User-Role", user.Role)

		// Set user in context for role checking
		c.Set("user", user)

		c.Next()
	}
}

func (m *AuthMiddleware) RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		val, exists := c.Get("user")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated."})
			return
		}
		user, ok := val.(*auth.User)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Internal error."})
			return
		}
		if user.Role != role {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden: Requires role " + role})
			return
		}
		c.Next()
	}
}
