package services

import (
	"context"
	"database/sql"
	"fmt"
	"io"
	"strings"

	_ "github.com/lib/pq"
	"github.com/sirupsen/logrus"

	"backend/internal/models"
)

// PostgresService handles PostgreSQL operations
type PostgresService struct {
	logger        *logrus.Logger
	dockerService *DockerService
}

// NewPostgresService creates a new PostgreSQL service
func NewPostgresService(logger *logrus.Logger) *PostgresService {
	return &PostgresService{
		logger:        logger,
		dockerService: NewDockerService(logger),
	}
}

// GetDatabases returns all databases in a PostgreSQL container
func (s *PostgresService) GetDatabases(ctx context.Context, dockerHost, containerID string) ([]models.DatabaseResponse, error) {
	// Execute psql command to list databases
	cmd := []string{
		"psql", "-U", "postgres", "-t", "-c",
		"SELECT datname, pg_catalog.pg_get_userbyid(datdba) as owner, pg_encoding_to_char(encoding) as encoding, pg_size_pretty(pg_database_size(datname)) as size FROM pg_database WHERE datistemplate = false;",
	}

	output, err := s.dockerService.ExecuteCommand(ctx, dockerHost, containerID, cmd)
	if err != nil {
		// Try with different user if postgres user fails
		cmd[2] = "root"
		output, err = s.dockerService.ExecuteCommand(ctx, dockerHost, containerID, cmd)
		if err != nil {
			return nil, fmt.Errorf("failed to list databases: %w", err)
		}
	}

	return s.parseDatabaseList(output), nil
}

// parseDatabaseList parses the output of the database list command
func (s *PostgresService) parseDatabaseList(output string) []models.DatabaseResponse {
	var databases []models.DatabaseResponse
	lines := strings.Split(strings.TrimSpace(output), "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Split by | delimiter and trim whitespace
		parts := strings.Split(line, "|")
		if len(parts) >= 4 {
			db := models.DatabaseResponse{
				Name:     strings.TrimSpace(parts[0]),
				Owner:    strings.TrimSpace(parts[1]),
				Encoding: strings.TrimSpace(parts[2]),
				Size:     strings.TrimSpace(parts[3]),
			}
			databases = append(databases, db)
		} else if len(parts) >= 1 {
			// Fallback for simpler output
			db := models.DatabaseResponse{
				Name: strings.TrimSpace(parts[0]),
			}
			databases = append(databases, db)
		}
	}

	s.logger.Infof("Found %d databases", len(databases))
	return databases
}

// CreateDump creates a PostgreSQL dump and returns a reader
func (s *PostgresService) CreateDump(ctx context.Context, dockerHost, containerID, database string, options map[string]interface{}) (io.ReadCloser, error) {
	cmd := s.buildPgDumpCommand(database, options)

	s.logger.Infof("Creating dump for database %s with command: %v", database, cmd)

	reader, err := s.dockerService.StreamCommand(ctx, dockerHost, containerID, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to create dump: %w", err)
	}

	return reader, nil
}

// buildPgDumpCommand builds the pg_dump command with options
func (s *PostgresService) buildPgDumpCommand(database string, options map[string]interface{}) []string {
	cmd := []string{"pg_dump", "-U", "postgres", "-h", "localhost"}

	// Add options
	if dataOnly, ok := options["data_only"].(bool); ok && dataOnly {
		cmd = append(cmd, "--data-only")
	}

	if schemaOnly, ok := options["schema_only"].(bool); ok && schemaOnly {
		cmd = append(cmd, "--schema-only")
	}

	if tables, ok := options["tables"].([]string); ok && len(tables) > 0 {
		for _, table := range tables {
			cmd = append(cmd, "-t", table)
		}
	}

	// Add database name
	cmd = append(cmd, database)

	return cmd
}

// TestConnection tests connection to PostgreSQL container
func (s *PostgresService) TestConnection(ctx context.Context, dockerHost, containerID string) error {
	cmd := []string{"pg_isready", "-U", "postgres", "-h", "localhost"}

	_, err := s.dockerService.ExecuteCommand(ctx, dockerHost, containerID, cmd)
	if err != nil {
		return fmt.Errorf("postgresql connection test failed: %w", err)
	}

	return nil
}

// GetConnectionString builds a connection string for direct PostgreSQL connection
func (s *PostgresService) GetConnectionString(host, port, user, password, database string) string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		user, password, host, port, database)
}

// ConnectDirect connects directly to PostgreSQL using connection parameters
func (s *PostgresService) ConnectDirect(ctx context.Context, connStr string) (*sql.DB, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Test connection
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}

// GetDatabasesDirect gets databases using direct connection
func (s *PostgresService) GetDatabasesDirect(ctx context.Context, connStr string) ([]models.DatabaseResponse, error) {
	db, err := s.ConnectDirect(ctx, connStr)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	query := `
        SELECT 
            datname,
            pg_catalog.pg_get_userbyid(datdba) as owner,
            pg_encoding_to_char(encoding) as encoding,
            pg_size_pretty(pg_database_size(datname)) as size
        FROM pg_database 
        WHERE datistemplate = false
        ORDER BY datname;
    `

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query databases: %w", err)
	}
	defer rows.Close()

	var databases []models.DatabaseResponse
	for rows.Next() {
		var db models.DatabaseResponse
		err := rows.Scan(&db.Name, &db.Owner, &db.Encoding, &db.Size)
		if err != nil {
			s.logger.Warnf("Failed to scan database row: %v", err)
			continue
		}
		databases = append(databases, db)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over database rows: %w", err)
	}

	return databases, nil
}
