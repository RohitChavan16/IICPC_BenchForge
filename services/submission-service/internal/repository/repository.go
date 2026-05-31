package repository

import (
	"database/sql"

	"github.com/RohitChavan16/IICPC_BenchForge/services/submission-service/internal/model"
)

func ListSubmissions(db *sql.DB, limit int) ([]model.Submission, error) {
	rows, err := db.Query(`SELECT id, team_name, submission_name, language, file_path, status, created_at, updated_at FROM submissions ORDER BY created_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []model.Submission{}
	for rows.Next() {
		var s model.Submission
		if err := rows.Scan(&s.ID, &s.TeamName, &s.SubmissionName, &s.Language, &s.FilePath, &s.Status, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, s)
	}
	return items, rows.Err()
}

func GetSubmissionByID(db *sql.DB, id string) (*model.Submission, error) {
	row := db.QueryRow(`SELECT id, team_name, submission_name, language, file_path, status, created_at, updated_at FROM submissions WHERE id=$1`, id)

	var s model.Submission
	if err := row.Scan(&s.ID, &s.TeamName, &s.SubmissionName, &s.Language, &s.FilePath, &s.Status, &s.CreatedAt, &s.UpdatedAt); err != nil {
		return nil, err
	}
	return &s, nil
}

func CreateSubmission(db *sql.DB, teamName, submissionName, language, filePath string) (*model.Submission, error) {
	query := `
	INSERT INTO submissions (team_name, submission_name, language, file_path, status, created_at, updated_at)
	VALUES ($1, $2, $3, $4, 'UPLOADED', now(), now())
	RETURNING id, team_name, submission_name, language, file_path, status, created_at, updated_at
	`

	row := db.QueryRow(query, teamName, submissionName, language, filePath)

	var s model.Submission
	if err := row.Scan(&s.ID, &s.TeamName, &s.SubmissionName, &s.Language, &s.FilePath, &s.Status, &s.CreatedAt, &s.UpdatedAt); err != nil {
		return nil, err
	}
	return &s, nil
}
