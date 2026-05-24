package database

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPostgresPool() *pgxpool.Pool {

	dbURL :=
		"postgres://postgres:password@postgres:5432/iicpc"

	pool, err := pgxpool.New(
		context.Background(),
		dbURL,
	)

	if err != nil {
		log.Fatal(err)
	}

	return pool
}