package auth

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID                 string    `json:"id"`
	AccountID          string    `json:"accountId"`
	Name               string    `json:"name"`
	Email              string    `json:"email"`
	Team               string    `json:"team"`
	NormalizedTeamName string    `json:"normalizedTeamName"`
	Role               string    `json:"role"`
	CreatedAt          time.Time `json:"createdAt"`
}

func CreateUser(db *sql.DB, name, email, team, role, passwordHash string) (*User, error) {
	id := uuid.NewString()
	
	// Format Account ID using the sequence
	var accountId string
	err := db.QueryRow(`SELECT 'BF-ACC-' || LPAD(nextval('account_id_seq')::text, 6, '0')`).Scan(&accountId)
	if err != nil {
		return nil, fmt.Errorf("generate account id: %w", err)
	}

	query := `INSERT INTO auth_users (id, account_id, name, email, team, normalized_team_name, role, password_hash) VALUES ($1, $2, $3, $4, $5, LOWER(TRIM($5)), $6, $7) RETURNING normalized_team_name`
	var normalizedTeamName string
	err = db.QueryRow(query, id, accountId, name, email, team, role, passwordHash).Scan(&normalizedTeamName)
	if err != nil {
		return nil, fmt.Errorf("insert user: %w", err)
	}
	return &User{ID: id, AccountID: accountId, Name: name, Email: email, Team: team, NormalizedTeamName: normalizedTeamName, Role: role}, nil
}

func GetUserByEmail(db *sql.DB, email string) (*User, string, error) {
	query := `SELECT id, account_id, name, email, team, normalized_team_name, role, password_hash, created_at FROM auth_users WHERE email = $1`
	row := db.QueryRow(query, email)
	var user User
	var passwordHash string
	if err := row.Scan(&user.ID, &user.AccountID, &user.Name, &user.Email, &user.Team, &user.NormalizedTeamName, &user.Role, &passwordHash, &user.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, "", nil
		}
		return nil, "", fmt.Errorf("scan user by email: %w", err)
	}
	return &user, passwordHash, nil
}

func GetUserByID(db *sql.DB, id string) (*User, error) {
	query := `SELECT id, account_id, name, email, team, normalized_team_name, role, created_at FROM auth_users WHERE id = $1`
	row := db.QueryRow(query, id)
	var user User
	if err := row.Scan(&user.ID, &user.AccountID, &user.Name, &user.Email, &user.Team, &user.NormalizedTeamName, &user.Role, &user.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("scan user by id: %w", err)
	}
	return &user, nil
}
