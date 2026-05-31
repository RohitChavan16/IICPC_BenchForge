package server

import (
	"database/sql"

	"github.com/gorilla/mux"

	"github.com/RohitChavan16/IICPC_BenchForge/services/deployment-service/internal/handlers"
)

func NewServer(db *sql.DB) *mux.Router {
	r := mux.NewRouter()
	h := handlers.NewHandler(db)

	r.HandleFunc("/deployments", h.ListDeployments).Methods("GET")
	r.HandleFunc("/deployments", h.CreateDeployment).Methods("POST")
	r.HandleFunc("/deployments/{id}", h.GetDeployment).Methods("GET")
	r.HandleFunc("/deployments/{id}/stop", h.StopDeployment).Methods("POST")

	return r
}
