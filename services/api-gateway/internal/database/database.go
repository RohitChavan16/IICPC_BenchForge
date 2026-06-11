package database

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

func NewPostgresDB(dsn string) (*sql.DB, error) {
	if dsn == "" {
		dsn = "postgres://postgres:password@postgres:5432/iicpc?sslmode=disable"
	}
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("ping db: %w", err)
	}
	return db, nil
}

func EnsureAuthUsersTable(db *sql.DB) error {
	query := `
CREATE TABLE IF NOT EXISTS auth_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    team TEXT NOT NULL,
    role TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS account_id_seq START 1;

ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS account_id VARCHAR UNIQUE;
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS normalized_team_name TEXT;

-- Backfill existing users
UPDATE auth_users 
SET account_id = 'BF-ACC-' || LPAD(nextval('account_id_seq')::text, 6, '0') 
WHERE account_id IS NULL;

UPDATE auth_users 
SET normalized_team_name = LOWER(TRIM(team)) 
WHERE normalized_team_name IS NULL;
`
	_, err := db.Exec(query)
	return err
}
