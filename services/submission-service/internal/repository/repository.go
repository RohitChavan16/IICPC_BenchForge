package repository

import (
	"database/sql"

	"github.com/RohitChavan16/IICPC_BenchForge/services/submission-service/internal/model"
)

func ListSubmissions(db *sql.DB, limit int) ([]model.Submission, error) {
	rows, err := db.Query(`SELECT id, user_id, team_id, team_name, submission_name, language, file_path, file_size_bytes, status, current_stage, stage_status, failure_reason, started_at, finished_at, build_log, created_at, updated_at, correctness_score, correctness_details FROM submissions ORDER BY created_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []model.Submission{}
	for rows.Next() {
		var s model.Submission
		var userID, teamID, currentStage, stageStatus, failureReason, buildLog sql.NullString
		var startedAt, finishedAt sql.NullTime
		var correctnessScore sql.NullFloat64
		var fileSizeBytes sql.NullInt64
		var correctnessDetailsRaw []byte

		if err := rows.Scan(&s.ID, &userID, &teamID, &s.TeamName, &s.SubmissionName, &s.Language, &s.FilePath, &fileSizeBytes, &s.Status, &currentStage, &stageStatus, &failureReason, &startedAt, &finishedAt, &buildLog, &s.CreatedAt, &s.UpdatedAt, &correctnessScore, &correctnessDetailsRaw); err != nil {
			return nil, err
		}
		s.UserID = userID.String
		s.TeamID = teamID.String
		s.CurrentStage = currentStage.String
		s.StageStatus = stageStatus.String
		s.FailureReason = failureReason.String
		if startedAt.Valid {
			s.StartedAt = &startedAt.Time
		}
		if finishedAt.Valid {
			s.FinishedAt = &finishedAt.Time
		}
		s.BuildLog = buildLog.String
		if correctnessScore.Valid {
			score := correctnessScore.Float64
			s.CorrectnessScore = &score
		}
		if fileSizeBytes.Valid {
			size := fileSizeBytes.Int64
			s.FileSizeBytes = &size
		}
		if len(correctnessDetailsRaw) > 0 {
			s.CorrectnessDetails = string(correctnessDetailsRaw)
		}
		items = append(items, s)
	}
	return items, rows.Err()
}

func GetSubmissionByID(db *sql.DB, id string) (*model.Submission, error) {
	row := db.QueryRow(`SELECT id, user_id, team_id, team_name, submission_name, language, file_path, file_size_bytes, status, current_stage, stage_status, failure_reason, started_at, finished_at, build_log, created_at, updated_at, correctness_score, correctness_details FROM submissions WHERE id=$1`, id)

	var s model.Submission
	var userID, teamID, currentStage, stageStatus, failureReason, buildLog sql.NullString
	var startedAt, finishedAt sql.NullTime
	var correctnessScore sql.NullFloat64
	var fileSizeBytes sql.NullInt64
	var correctnessDetailsRaw []byte
	if err := row.Scan(&s.ID, &userID, &teamID, &s.TeamName, &s.SubmissionName, &s.Language, &s.FilePath, &fileSizeBytes, &s.Status, &currentStage, &stageStatus, &failureReason, &startedAt, &finishedAt, &buildLog, &s.CreatedAt, &s.UpdatedAt, &correctnessScore, &correctnessDetailsRaw); err != nil {
		return nil, err
	}
	s.UserID = userID.String
	s.TeamID = teamID.String
	s.CurrentStage = currentStage.String
	s.StageStatus = stageStatus.String
	s.FailureReason = failureReason.String
	if startedAt.Valid {
		s.StartedAt = &startedAt.Time
	}
	if finishedAt.Valid {
		s.FinishedAt = &finishedAt.Time
	}
	s.BuildLog = buildLog.String
	if correctnessScore.Valid {
		score := correctnessScore.Float64
		s.CorrectnessScore = &score
	}
	if fileSizeBytes.Valid {
		size := fileSizeBytes.Int64
		s.FileSizeBytes = &size
	}
	if len(correctnessDetailsRaw) > 0 {
		s.CorrectnessDetails = string(correctnessDetailsRaw)
	}
	return &s, nil
}

func CreateSubmission(db *sql.DB, teamName, submissionName, language, filePath string, fileSizeBytes int64, userID, teamID string) (*model.Submission, error) {
	query := `
	INSERT INTO submissions (team_name, submission_name, language, file_path, file_size_bytes, status, created_at, updated_at, user_id, team_id)
	VALUES ($1, $2, $3, $4, $5, 'UPLOADED', now(), now(), $6, $7)
	RETURNING id, user_id, team_id, team_name, submission_name, language, file_path, file_size_bytes, status, current_stage, stage_status, failure_reason, started_at, finished_at, created_at, updated_at
	`

	row := db.QueryRow(query, teamName, submissionName, language, filePath, fileSizeBytes, userID, teamID)

	var s model.Submission
	var returnedUserID, returnedTeamID, currentStage, stageStatus, failureReason sql.NullString
	var startedAt, finishedAt sql.NullTime
	var returnedFileSizeBytes sql.NullInt64
	if err := row.Scan(&s.ID, &returnedUserID, &returnedTeamID, &s.TeamName, &s.SubmissionName, &s.Language, &s.FilePath, &returnedFileSizeBytes, &s.Status, &currentStage, &stageStatus, &failureReason, &startedAt, &finishedAt, &s.CreatedAt, &s.UpdatedAt); err != nil {
		return nil, err
	}
	s.UserID = returnedUserID.String
	s.TeamID = returnedTeamID.String
	s.CurrentStage = currentStage.String
	s.StageStatus = stageStatus.String
	s.FailureReason = failureReason.String
	if returnedFileSizeBytes.Valid {
		size := returnedFileSizeBytes.Int64
		s.FileSizeBytes = &size
	}
	if startedAt.Valid {
		s.StartedAt = &startedAt.Time
	}
	if finishedAt.Valid {
		s.FinishedAt = &finishedAt.Time
	}
	return &s, nil
}
