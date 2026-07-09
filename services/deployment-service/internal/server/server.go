package server

import (
	"database/sql"

	"github.com/gorilla/mux"
	"github.com/redis/go-redis/v9"

	"github.com/RohitChavan16/IICPC_BenchForge/services/deployment-service/internal/config"
	"github.com/RohitChavan16/IICPC_BenchForge/services/deployment-service/internal/handlers"
	"github.com/RohitChavan16/IICPC_BenchForge/services/deployment-service/internal/middleware"
)

func NewServer(cfg *config.Config, db *sql.DB, rdb *redis.Client) *mux.Router {
	r := mux.NewRouter()
	r.Use(middleware.Recovery)
	h := handlers.NewHandler(cfg, db, rdb)

	r.HandleFunc("/deployments", h.ListDeployments).Methods("GET")
	r.HandleFunc("/deployments", h.CreateDeployment).Methods("POST")
	r.HandleFunc("/deployments/{id}", h.GetDeployment).Methods("GET")
	r.HandleFunc("/deployments/{id}/stop", h.StopDeployment).Methods("POST")

	return r
}
