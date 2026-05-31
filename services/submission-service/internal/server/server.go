package server

import (
	"database/sql"

	"github.com/gorilla/mux"

	"github.com/RohitChavan16/IICPC_BenchForge/services/submission-service/internal/handlers"
)

func NewServer(db *sql.DB, uploadDir string) *mux.Router {
	r := mux.NewRouter()
	submissionHandler := handlers.NewSubmissionHandler(db, uploadDir)

	r.HandleFunc("/submissions", submissionHandler.ListSubmissions).Methods("GET")
	r.HandleFunc("/submissions", submissionHandler.CreateSubmission).Methods("POST")
	r.HandleFunc("/submissions/{id}", submissionHandler.GetSubmissionByID).Methods("GET")

	return r
}
