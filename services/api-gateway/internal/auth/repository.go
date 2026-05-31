package auth

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Team      string    `json:"team"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
}

func CreateUser(db *sql.DB, name, email, team, role, passwordHash string) (*User, error) {
	id := uuid.NewString()
	query := `INSERT INTO auth_users (id, name, email, team, role, password_hash) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := db.Exec(query, id, name, email, team, role, passwordHash)
	if err != nil {
		return nil, fmt.Errorf("insert user: %w", err)
	}
	return &User{ID: id, Name: name, Email: email, Team: team, Role: role}, nil
}

func GetUserByEmail(db *sql.DB, email string) (*User, string, error) {
	query := `SELECT id, name, email, team, role, password_hash, created_at FROM auth_users WHERE email = $1`
	row := db.QueryRow(query, email)
	var user User
	var passwordHash string
	if err := row.Scan(&user.ID, &user.Name, &user.Email, &user.Team, &user.Role, &passwordHash, &user.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, "", nil
		}
		return nil, "", fmt.Errorf("scan user by email: %w", err)
	}
	return &user, passwordHash, nil
}

func GetUserByID(db *sql.DB, id string) (*User, error) {
	query := `SELECT id, name, email, team, role, created_at FROM auth_users WHERE id = $1`
	row := db.QueryRow(query, id)
	var user User
	if err := row.Scan(&user.ID, &user.Name, &user.Email, &user.Team, &user.Role, &user.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("scan user by id: %w", err)
	}
	return &user, nil
}
