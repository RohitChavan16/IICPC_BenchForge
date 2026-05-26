package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"
)

type contextKey string

const RequestIDKey contextKey = "request_id"

func RequestIDMiddleware(next http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		requestID := r.Header.Get("X-Request-ID")

		if requestID == "" {
			requestID = "req_" + uuid.NewString()
		}

		// ADD TO CONTEXT
		ctx := context.WithValue(
			r.Context(),
			RequestIDKey,
			requestID,
		)

		// RETURN TO CLIENT
		w.Header().Set("X-Request-ID", requestID)

		next.ServeHTTP(
			w,
			r.WithContext(ctx),
		)
	})
}