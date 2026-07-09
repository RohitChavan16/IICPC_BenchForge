package middleware

import (
	"encoding/json"
	"log"
	"net/http"
	"runtime/debug"
)

func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("[Recovery] panic recovered: %s %s\n%v\n%s", r.Method, r.URL.Path, err, debug.Stack())
				
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				
				json.NewEncoder(w).Encode(map[string]interface{}{
					"success": false,
					"error":   "Internal Server Error",
				})
			}
		}()
		next.ServeHTTP(w, r)
	})
}
