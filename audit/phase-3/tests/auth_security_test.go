package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

// Replicate getClientIP from services/api-gateway/internal/middleware/ratelimit.go:88-102
func getClientIP(r *http.Request) string {
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		parts := strings.Split(ip, ",")
		return strings.TrimSpace(parts[0])
	}
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	remoteAddr := r.RemoteAddr
	if idx := strings.LastIndex(remoteAddr, ":"); idx != -1 {
		return remoteAddr[:idx]
	}
	return remoteAddr
}

func TestSecurity_RateLimitBypassViaXForwardedFor(t *testing.T) {
	// Demonstrate that an attacker can rotate X-Forwarded-For to bypass IP rate limits
	t.Log("Testing getClientIP with spoofed X-Forwarded-For headers...")

	req1 := httptest.NewRequest("GET", "/auth/login", nil)
	req1.RemoteAddr = "192.168.1.100:54321"
	req1.Header.Set("X-Forwarded-For", "10.0.0.1")

	req2 := httptest.NewRequest("GET", "/auth/login", nil)
	req2.RemoteAddr = "192.168.1.100:54321" // Same physical socket
	req2.Header.Set("X-Forwarded-For", "10.0.0.2") // Spoofed IP

	ip1 := getClientIP(req1)
	ip2 := getClientIP(req2)

	if ip1 == ip2 {
		t.Fatalf("Expected different client IPs for spoofed headers, got %s and %s", ip1, ip2)
	}

	t.Logf("CONFIRMED VULNERABILITY (BF-P3-001): Client IP evaluated as %s and %s from same remote address %s",
		ip1, ip2, req1.RemoteAddr)
	t.Log("Impact: Attackers can trivially bypass all IP rate limits on /auth/login and /auth/register by randomizing X-Forwarded-For.")
}

func TestSecurity_JWTValidationSemantics(t *testing.T) {
	jwtSecret := "super_secret_test_key_12345"

	// 1. Valid Token signed with HS256
	validClaims := jwt.MapClaims{
		"sub":  "user-123",
		"role": "contestant",
		"exp":  time.Now().Add(time.Hour).Unix(),
	}
	validToken := jwt.NewWithClaims(jwt.SigningMethodHS256, validClaims)
	validTokenStr, err := validToken.SignedString([]byte(jwtSecret))
	if err != nil {
		t.Fatalf("Failed to sign token: %v", err)
	}

	// Verify valid token
	parsedToken, err := jwt.Parse(validTokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(jwtSecret), nil
	})
	if err != nil || !parsedToken.Valid {
		t.Fatalf("Valid token failed verification: %v", err)
	}
	t.Log("Verified: Valid HMAC-SHA256 token passes verification.")

	// 2. Reject "none" algorithm attack
	noneToken := jwt.NewWithClaims(jwt.SigningMethodNone, validClaims)
	noneTokenStr, _ := noneToken.SignedString(jwt.UnsafeAllowNoneSignatureType)

	_, errNone := jwt.Parse(noneTokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})
	if errNone == nil {
		t.Fatalf("Algorithm 'none' token was accepted! Security failure.")
	}
	t.Logf("Verified: 'none' algorithm token properly rejected: %v", errNone)

	// 3. Reject tampered signature
	tamperedTokenStr := validTokenStr[:len(validTokenStr)-6] + "xxxxxx"
	_, errTampered := jwt.Parse(tamperedTokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(jwtSecret), nil
	})
	if errTampered == nil {
		t.Fatalf("Tampered token was accepted! Security failure.")
	}
	t.Logf("Verified: Tampered signature properly rejected: %v", errTampered)
}

func TestSecurity_CrossUserSubmissionAccessGap(t *testing.T) {
	// Replicate submission-service handlers/submissions.go:140-158
	// func (h *SubmissionHandler) GetSubmissionByID(w http.ResponseWriter, r *http.Request)
	// Notice: it accepts id := mux.Vars(r)["id"], queries DB, and returns submission without checking user/team!

	t.Log("Auditing GetSubmissionByID and StreamLogs authorization boundaries...")
	t.Log("Finding (BF-P3-002 - IDOR):")
	t.Log("1. submission-service GetSubmissionByID does NOT inspect X-User-Id or X-Team-Id.")
	t.Log("2. StreamLogs (/submissions/{id}/stream) connects directly to pipeline_logs:{id} without verifying caller ownership.")
	t.Log("3. Any contestant can read any competitor's code build logs, scenario validation outputs, and deployment metadata simply by knowing or guessing UUIDs.")
}
