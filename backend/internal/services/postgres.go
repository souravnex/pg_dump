package services

import (
	"context"
	"fmt"
	"io"
	"os/exec"
	"strings"

	"github.com/sirupsen/logrus"

	"backend/internal/config"
	"backend/internal/models"
)

// PostgresService handles PostgreSQL operations
type PostgresService struct {
	logger *logrus.Logger
}

// NewPostgresService creates a new PostgreSQL service
func NewPostgresService(logger *logrus.Logger) *PostgresService {
	return &PostgresService{
		logger: logger,
	}
}

// GetDatabases returns databases in a specific PostgreSQL container (legacy method)
func (s *PostgresService) GetDatabases(ctx context.Context, dockerHost, containerID string) ([]models.DatabaseResponse, error) {
	// This is the old method - you might want to keep it for local Docker API usage
	// or migrate it to use SSH as well
	s.logger.Warnf("Using legacy GetDatabases method for container %s", containerID)
	return []models.DatabaseResponse{}, nil
}

// GetDatabasesViaSSH returns databases in a PostgreSQL container via SSH
func (s *PostgresService) GetDatabasesViaSSH(ctx context.Context, server *config.Server, containerID string, sshService *SSHService) ([]models.DatabaseResponse, error) {
	s.logger.Infof("Getting databases from container %s on server %s via SSH", containerID, server.Host)

	// For local servers
	if server.Host == "localhost" || server.Host == "127.0.0.1" || server.Host == "" {
		return s.getLocalDatabases(ctx, containerID)
	}

	postgresUser := server.PostgresUser
	if postgresUser == "" {
		postgresUser = "postgres" // Default fallback
	}

	// Command to list databases with size information using the correct PostgreSQL user
	dockerCmd := fmt.Sprintf(`docker exec %s psql -U %s -tAc "SELECT d.datname, r.rolname, pg_encoding_to_char(d.encoding), pg_size_pretty(pg_database_size(d.datname)) FROM pg_database d JOIN pg_roles r ON d.datdba = r.oid WHERE d.datistemplate = false;"`, containerID, postgresUser)

	output, err := sshService.ExecuteRemoteCommand(server, dockerCmd)
	if err != nil {
		// If postgres user doesn't work, try with different approaches
		s.logger.Warnf("Failed with postgres user, trying alternative methods: %v", err)
		
		// Try to find the correct user by inspecting the container
		inspectCmd := fmt.Sprintf(`docker exec %s env | grep POSTGRES_USER`, containerID)
		userOutput, userErr := sshService.ExecuteRemoteCommand(server, inspectCmd)
		
		if userErr == nil && strings.Contains(userOutput, "POSTGRES_USER=") {
			// Extract username
			lines := strings.Split(userOutput, "\n")
			for _, line := range lines {
				if strings.HasPrefix(line, "POSTGRES_USER=") {
					username := strings.TrimPrefix(line, "POSTGRES_USER=")
					username = strings.TrimSpace(username)
					
					// Try with the found username
					dockerCmd = fmt.Sprintf(`docker exec %s psql -U %s -tAc "SELECT d.datname, r.rolname, pg_encoding_to_char(d.encoding), pg_size_pretty(pg_database_size(d.datname)) FROM pg_database d JOIN pg_roles r ON d.datdba = r.oid WHERE d.datistemplate = false;"`, containerID, username)
					output, err = sshService.ExecuteRemoteCommand(server, dockerCmd)
					if err == nil {
						break
					}
				}
			}
		}
		
		// If still failing, try without specifying user (uses default)
		if err != nil {
			dockerCmd = fmt.Sprintf(`docker exec %s psql -tAc "SELECT d.datname, r.rolname, pg_encoding_to_char(d.encoding), pg_size_pretty(pg_database_size(d.datname)) FROM pg_database d JOIN pg_roles r ON d.datdba = r.oid WHERE d.datistemplate = false;"`, containerID)
			output, err = sshService.ExecuteRemoteCommand(server, dockerCmd)
		}

		if err != nil {
			return nil, fmt.Errorf("failed to get databases from container %s: %w", containerID, err)
		}
	}

	databases := s.parseDatabaseOutput(output)
	s.logger.Infof("Found %d databases in container %s", len(databases), containerID)
	return databases, nil
}

// getLocalDatabases handles local database discovery
func (s *PostgresService) getLocalDatabases(ctx context.Context, containerID string) ([]models.DatabaseResponse, error) {
	// Use local docker command with size information
	cmd := exec.Command("docker", "exec", containerID, "psql", "-U", "postgres", "-tAc", "SELECT d.datname, r.rolname, pg_encoding_to_char(d.encoding), pg_size_pretty(pg_database_size(d.datname)) FROM pg_database d JOIN pg_roles r ON d.datdba = r.oid WHERE d.datistemplate = false;")
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Try alternative approaches for local as well
		cmd = exec.Command("docker", "exec", containerID, "psql", "-tAc", "SELECT d.datname, r.rolname, pg_encoding_to_char(d.encoding), pg_size_pretty(pg_database_size(d.datname)) FROM pg_database d JOIN pg_roles r ON d.datdba = r.oid WHERE d.datistemplate = false;")
		output, err = cmd.CombinedOutput()
		if err != nil {
			return nil, fmt.Errorf("failed to get local databases: %w", err)
		}
	}

	return s.parseDatabaseOutput(string(output)), nil
}

// parseDatabaseOutput parses the output from psql command with database details
func (s *PostgresService) parseDatabaseOutput(output string) []models.DatabaseResponse {
	var databases []models.DatabaseResponse
	
	s.logger.Debugf("Parsing database output: %s", output)
	
	lines := strings.Split(strings.TrimSpace(output), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		
		// Split the line by pipe separator (psql -tAc uses pipe as separator)
		parts := strings.Split(line, "|")
		if len(parts) < 4 {
			// Fallback for old format or malformed output
			if !s.isValidDatabaseName(line) {
				s.logger.Warnf("Skipping invalid database name: %s", line)
				continue
			}
			
			// Skip system databases
			if line == "template0" || line == "template1" {
				continue
			}
			
			database := models.DatabaseResponse{
				Name:     line,
				Owner:    "postgres",
				Encoding: "UTF8",
				Size:     "Unknown",
			}
			databases = append(databases, database)
			continue
		}
		
		// Parse the new format: name|owner|encoding|size
		dbName := strings.TrimSpace(parts[0])
		owner := strings.TrimSpace(parts[1])
		encoding := strings.TrimSpace(parts[2])
		size := strings.TrimSpace(parts[3])
		
		// Skip system databases
		if dbName == "template0" || dbName == "template1" {
			continue
		}
		
		// Validate database name
		if !s.isValidDatabaseName(dbName) {
			s.logger.Warnf("Skipping invalid database name: %s", dbName)
			continue
		}
		
		database := models.DatabaseResponse{
			Name:     dbName,
			Owner:    owner,
			Encoding: encoding,
			Size:     size,
		}
		
		databases = append(databases, database)
	}
	
	return databases
}

// isValidDatabaseName validates if a string is a valid PostgreSQL database name
func (s *PostgresService) isValidDatabaseName(name string) bool {
	// Skip empty names
	if name == "" {
		return false
	}
	if name == "postgres"{
		return false
	}
	// Skip file paths (containing / or \)
	if strings.Contains(name, "/") || strings.Contains(name, "\\") {
		return false
	}
	
	// Skip paths starting with dot (like .ssh)
	if strings.HasPrefix(name, ".") {
		return false
	}
	
	// Skip error messages or commands
	if strings.Contains(name, "psql:") || strings.Contains(name, "error:") || 
	   strings.Contains(name, "ERROR:") || strings.Contains(name, "FATAL:") {
		return false
	}
	
	// PostgreSQL database names should be alphanumeric with underscores/hyphens
	// and should not exceed 63 characters
	if len(name) > 63 {
		return false
	}
	
	// Check for valid characters (letters, numbers, underscore, hyphen)
	for _, char := range name {
		if !((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || 
		     (char >= '0' && char <= '9') || char == '_' || char == '-') {
			return false
		}
	}
	
	return true
}

// CreateDump creates a PostgreSQL database dump (legacy method)
func (s *PostgresService) CreateDump(ctx context.Context, dockerHost, containerID, dbName string, options map[string]interface{}) (io.ReadCloser, error) {
	s.logger.Warnf("Using legacy CreateDump method for database %s", dbName)
	return nil, fmt.Errorf("legacy CreateDump method not implemented")
}

// CreateDumpViaSSH creates a PostgreSQL database dump via SSH
func (s *PostgresService) CreateDumpViaSSH(ctx context.Context, server *config.Server, containerID, dbName string, options map[string]interface{}, sshService *SSHService) (io.ReadCloser, error) {
	s.logger.Infof("Creating dump for database %s in container %s on server %s", dbName, containerID, server.Host)

	// Build pg_dump command with options
	dumpCmd := s.buildDumpCommand(server, containerID, dbName, options)

	// For local servers
	if server.Host == "localhost" || server.Host == "127.0.0.1" || server.Host == "" {
		return s.createLocalDump(ctx, dumpCmd)
	}

	// For remote servers, create a streaming SSH command
	return s.createRemoteDump(server, dumpCmd, sshService)
}

// buildDumpCommand builds the pg_dump command with options
func (s *PostgresService) buildDumpCommand(server *config.Server, containerID, dbName string, options map[string]interface{}) string {
	postgresUser := "postgres"
	if server.PostgresUser != "" {
		postgresUser = server.PostgresUser
	}
	
	// This should generate: docker exec -t 26b181849372 pg_dump -U postgres -d srm_hr
	cmd := fmt.Sprintf("docker exec -t %s pg_dump -U %s -d %s", containerID, postgresUser, dbName)
	
	// Add dump options
	if dataOnly, exists := options["data_only"]; exists && dataOnly.(bool) {
		cmd += " --data-only"
	}
	
	if schemaOnly, exists := options["schema_only"]; exists && schemaOnly.(bool) {
		cmd += " --schema-only"
	}
	
	s.logger.Infof("Built dump command: %s", cmd)
	return cmd
}

// createLocalDump creates a dump using local docker command
func (s *PostgresService) createLocalDump(ctx context.Context, dumpCmd string) (io.ReadCloser, error) {
	// Split command for exec.CommandContext
	parts := strings.Fields(dumpCmd)
	cmd := exec.CommandContext(ctx, parts[0], parts[1:]...)
	
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create stdout pipe: %w", err)
	}
	
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start dump command: %w", err)
	}
	
	// Return a custom reader that waits for the command to finish
	return &localDumpReader{
		ReadCloser: stdout,
		cmd:        cmd,
		logger:     s.logger,
	}, nil
}

// createRemoteDump creates a dump using SSH command
func (s *PostgresService) createRemoteDump(server *config.Server, dumpCmd string, sshService *SSHService) (io.ReadCloser, error) {
	// Build SSH target with username
	var sshTarget string
	if server.Username != "" {
		sshTarget = fmt.Sprintf("%s@%s", server.Username, server.Host)
	} else {
		sshTarget = server.Host
	}
	
	s.logger.Infof("Creating remote dump via SSH: %s with command: %s", sshTarget, dumpCmd)
	
	// Create SSH command with private key authentication
	var sshCmd *exec.Cmd
	if server.PrivateKey != "" {
		sshCmd = exec.Command("ssh", "-i", server.PrivateKey, "-o", "StrictHostKeyChecking=no", sshTarget, dumpCmd)
	} else {
		sshCmd = exec.Command("ssh", "-o", "StrictHostKeyChecking=no", sshTarget, dumpCmd)
	}
	
	stdout, err := sshCmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create SSH stdout pipe: %w", err)
	}
	
	// Also capture stderr for debugging
	stderr, err := sshCmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create SSH stderr pipe: %w", err)
	}
	
	// Log stderr in a goroutine
	go func() {
		stderrOutput := make([]byte, 1024)
		for {
			n, err := stderr.Read(stderrOutput)
			if n > 0 {
				s.logger.Errorf("SSH stderr: %s", string(stderrOutput[:n]))
			}
			if err != nil {
				break
			}
		}
	}()
	
	if err := sshCmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start SSH dump command: %w", err)
	}
	
	// Return a custom reader that waits for the SSH command to finish
	return &remoteDumpReader{
		ReadCloser: stdout,
		cmd:        sshCmd,
		logger:     s.logger,
	}, nil
}

// localDumpReader wraps local command execution for streaming
type localDumpReader struct {
	io.ReadCloser
	cmd    *exec.Cmd
	logger *logrus.Logger
}

func (r *localDumpReader) Close() error {
	// Close the pipe first
	if err := r.ReadCloser.Close(); err != nil {
		r.logger.Errorf("Error closing dump reader: %v", err)
	}
	
	// Wait for command to finish
	if err := r.cmd.Wait(); err != nil {
		r.logger.Errorf("Dump command failed: %v", err)
		return err
	}
	
	return nil
}

// remoteDumpReader wraps SSH command execution for streaming
type remoteDumpReader struct {
	io.ReadCloser
	cmd    *exec.Cmd
	logger *logrus.Logger
}

func (r *remoteDumpReader) Close() error {
	// Close the pipe first
	if err := r.ReadCloser.Close(); err != nil {
		r.logger.Errorf("Error closing SSH dump reader: %v", err)
	}
	
	// Wait for SSH command to finish
	if err := r.cmd.Wait(); err != nil {
		r.logger.Errorf("SSH dump command failed: %v", err)
		return err
	}
	
	return nil
}

// GetDatabaseInfo gets detailed information about a specific database
func (s *PostgresService) GetDatabaseInfo(ctx context.Context, server *config.Server, containerID, dbName string, sshService *SSHService) (*models.DatabaseResponse, error) {
	query := fmt.Sprintf(`SELECT d.datname, r.rolname, pg_encoding_to_char(d.encoding), pg_size_pretty(pg_database_size(d.datname)) FROM pg_database d JOIN pg_roles r ON d.datdba = r.oid WHERE d.datname = '%s'`, dbName)
	
	postgresUser := "postgres"
	if server.PostgresUser != "" {
		postgresUser = server.PostgresUser
	}
	
	if server.Host == "localhost" || server.Host == "127.0.0.1" || server.Host == "" {
		execCmd := exec.CommandContext(ctx, "docker", "exec", containerID, "psql", "-U", postgresUser, "-tAc", query)
		output, err := execCmd.CombinedOutput()
		if err != nil {
			return nil, fmt.Errorf("failed to get database info: %w", err)
		}
		return s.parseDatabaseInfo(string(output))
	} else {
		cmd := fmt.Sprintf(`docker exec %s psql -U %s -tAc "%s"`, containerID, postgresUser, query)
		output, err := sshService.ExecuteRemoteCommand(server, cmd)
		if err != nil {
			return nil, fmt.Errorf("failed to get database info via SSH: %w", err)
		}
		return s.parseDatabaseInfo(output)
	}
}

// parseDatabaseInfo parses detailed database information
func (s *PostgresService) parseDatabaseInfo(output string) (*models.DatabaseResponse, error) {
	line := strings.TrimSpace(output)
	if line == "" {
		return nil, fmt.Errorf("no database information found")
	}
	
	parts := strings.Split(line, "|")
	if len(parts) < 4 {
		return nil, fmt.Errorf("unexpected database info format")
	}
	
	return &models.DatabaseResponse{
		Name:     strings.TrimSpace(parts[0]),
		Owner:    strings.TrimSpace(parts[1]),
		Encoding: strings.TrimSpace(parts[2]),
		Size:     strings.TrimSpace(parts[3]),
	}, nil
}


// GetHostPostgreSQLDatabases gets databases from PostgreSQL installed on host
func (s *PostgresService) GetHostPostgreSQLDatabases(ctx context.Context, server *config.Server, sshService *SSHService) ([]models.DatabaseResponse, error) {
    s.logger.Infof("Getting host PostgreSQL databases from server %s", server.Host)

    // For local servers
    if server.Host == "localhost" || server.Host == "127.0.0.1" || server.Host == "" {
        return s.getLocalHostDatabases(ctx)
    }

    // For remote servers, check if PostgreSQL is installed on host
    postgresUser := server.PostgresUser
    if postgresUser == "" {
        postgresUser = "postgres"
    }

    // Command to list databases from host PostgreSQL with proper working directory
    cmd := fmt.Sprintf(`cd /tmp && sudo -u %s psql -tAc "SELECT d.datname, r.rolname, pg_encoding_to_char(d.encoding), pg_size_pretty(pg_database_size(d.datname)) FROM pg_database d JOIN pg_roles r ON d.datdba = r.oid WHERE d.datistemplate = false;"`, postgresUser)

    output, err := sshService.ExecuteRemoteCommand(server, cmd)
    if err != nil {
        s.logger.Warnf("First attempt failed: %v. Trying alternative method...", err)
        // Try alternative methods if sudo doesn't work
        cmd = fmt.Sprintf(`cd /tmp && psql -U %s -tAc "SELECT d.datname, r.rolname, pg_encoding_to_char(d.encoding), pg_size_pretty(pg_database_size(d.datname)) FROM pg_database d JOIN pg_roles r ON d.datdba = r.oid WHERE d.datistemplate = false;"`, postgresUser)
        output, err = sshService.ExecuteRemoteCommand(server, cmd)
        if err != nil {
            s.logger.Warnf("Alternative method failed: %v. Trying without user specification...", err)
            // Final fallback - try with default connection
            cmd = `cd /tmp && psql -tAc "SELECT d.datname, r.rolname, pg_encoding_to_char(d.encoding), pg_size_pretty(pg_database_size(d.datname)) FROM pg_database d JOIN pg_roles r ON d.datdba = r.oid WHERE d.datistemplate = false;"`
            output, err = sshService.ExecuteRemoteCommand(server, cmd)
            if err != nil {
                s.logger.Errorf("All PostgreSQL connection attempts failed: %v", err)
                return nil, fmt.Errorf("PostgreSQL not found on host or access denied: %w", err)
            }
        }
    }

    // Log the raw output for debugging
    s.logger.Debugf("Raw PostgreSQL output: %q", output)
    
    // Check if output contains error indicators before parsing
    if s.containsErrorMessages(output) {
        s.logger.Warnf("PostgreSQL command output contains error messages: %s", output)
        return nil, fmt.Errorf("PostgreSQL command failed with error output: %s", output)
    }

    // Check if output is empty or contains only whitespace
    if strings.TrimSpace(output) == "" {
        s.logger.Warnf("Empty output from PostgreSQL command")
        return []models.DatabaseResponse{}, nil
    }

    databases := s.parseDatabaseOutput(output)
    s.logger.Infof("Found %d host databases on %s", len(databases), server.Host)
    return databases, nil
}

// CreateHostDumpViaSSH creates a dump from host PostgreSQL
func (s *PostgresService) CreateHostDumpViaSSH(ctx context.Context, server *config.Server, dbName string, options map[string]interface{}, sshService *SSHService) (io.ReadCloser, error) {
    s.logger.Infof("Creating host dump for database %s on server %s", dbName, server.Host)

    // Build host pg_dump command
    dumpCmd := s.buildHostDumpCommand(server, dbName, options)

    // For local servers
    if server.Host == "localhost" || server.Host == "127.0.0.1" || server.Host == "" {
        return s.createLocalDump(ctx, dumpCmd)
    }

    // For remote servers, create a streaming SSH command
    return s.createRemoteDump(server, dumpCmd, sshService)
}

// buildHostDumpCommand builds pg_dump command for host PostgreSQL
func (s *PostgresService) buildHostDumpCommand(server *config.Server, dbName string, options map[string]interface{}) string {
    postgresUser := "postgres"
    if server.PostgresUser != "" {
        postgresUser = server.PostgresUser
    }

    // Host PostgreSQL command (no docker exec)
    cmd := fmt.Sprintf("sudo -u %s pg_dump -d %s", postgresUser, dbName)

    // Add dump options
    if dataOnly, exists := options["data_only"]; exists && dataOnly.(bool) {
        cmd += " --data-only"
    }

    if schemaOnly, exists := options["schema_only"]; exists && schemaOnly.(bool) {
        cmd += " --schema-only"
    }

    s.logger.Infof("Built host dump command: %s", cmd)
    return cmd
}

// containsErrorMessages checks if output contains common error patterns
func (s *PostgresService) containsErrorMessages(output string) bool {
    errorPatterns := []string{
        "psql: error:",
        "psql: FATAL:",
        "psql: could not connect",
        "Permission denied",
        "No such file or directory",
        "command not found",
        "Connection refused",
        "sudo:",
        "password authentication failed",
        "role \"postgres\" does not exist",
    }
    
    lowerOutput := strings.ToLower(output)
    for _, pattern := range errorPatterns {
        if strings.Contains(lowerOutput, strings.ToLower(pattern)) {
            return true
        }
    }
    return false
}

// getLocalHostDatabases handles local host PostgreSQL
func (s *PostgresService) getLocalHostDatabases(ctx context.Context) ([]models.DatabaseResponse, error) {
    cmd := exec.Command("psql", "-U", "postgres", "-tAc", "SELECT d.datname, r.rolname, pg_encoding_to_char(d.encoding), pg_size_pretty(pg_database_size(d.datname)) FROM pg_database d JOIN pg_roles r ON d.datdba = r.oid WHERE d.datistemplate = false;")
    output, err := cmd.CombinedOutput()
    if err != nil {
        s.logger.Errorf("Failed to execute local PostgreSQL command: %v", err)
        return nil, fmt.Errorf("failed to get local host databases: %w", err)
    }
    
    outputStr := string(output)
    s.logger.Debugf("Local PostgreSQL raw output: %q", outputStr)
    
    // Check for error messages in output
    if s.containsErrorMessages(outputStr) {
        s.logger.Warnf("Local PostgreSQL command output contains errors: %s", outputStr)
        return nil, fmt.Errorf("PostgreSQL command failed: %s", outputStr)
    }
    
    return s.parseDatabaseOutput(outputStr), nil
}
