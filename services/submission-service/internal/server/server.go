package server

import (
	"database/sql"

	"github.com/gorilla/mux"
	"github.com/redis/go-redis/v9"

	"github.com/RohitChavan16/IICPC_BenchForge/services/submission-service/internal/handlers"
	"github.com/RohitChavan16/IICPC_BenchForge/services/submission-service/internal/middleware"
)

func NewServer(db *sql.DB, rdb *redis.Client, uploadDir string) *mux.Router {
	r := mux.NewRouter()
	r.Use(middleware.Recovery)
	submissionHandler := handlers.NewSubmissionHandler(db, rdb, uploadDir)

	r.HandleFunc("/submissions", submissionHandler.ListSubmissions).Methods("GET")
	r.HandleFunc("/submissions", submissionHandler.CreateSubmission).Methods("POST")
	r.HandleFunc("/submissions/{id}", submissionHandler.GetSubmissionByID).Methods("GET")
	r.HandleFunc("/submissions/{id}/stream", submissionHandler.StreamLogs).Methods("GET")

	return r
}
