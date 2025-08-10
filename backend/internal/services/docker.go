package services

import (
	"context"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"github.com/sirupsen/logrus"

	"backend/internal/config"
	"backend/internal/models"
)

// DockerService handles Docker operations
type DockerService struct {
	logger *logrus.Logger
}

// NewDockerService creates a new Docker service
func NewDockerService(logger *logrus.Logger) *DockerService {
	return &DockerService{
		logger: logger,
	}
}

// GetDockerClient creates a Docker client for the specified host
func (s *DockerService) GetDockerClient(host string) (*client.Client, error) {
	var cli *client.Client
	var err error

	if host == "" {
		// Use default Docker host
		cli, err = client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	} else {
		// Use custom Docker host
		cli, err = client.NewClientWithOpts(
			client.WithHost(host),
			client.WithAPIVersionNegotiation(),
		)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create Docker client: %w", err)
	}

	return cli, nil
}

func (s *DockerService) GetPostgreSQLContainers(ctx context.Context, server *config.Server, sshService *SSHService) ([]models.ContainerResponse, error) {
    // For local servers, use direct Docker API
    if server.Host == "localhost" || server.Host == "127.0.0.1" || server.Host == "" {
        return s.getLocalContainers(ctx)
    }

    // For remote servers, use SSH to execute docker commands
    dockerCmd := `docker ps --format "{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"`
    
    s.logger.Infof("Getting PostgreSQL containers from remote server: %s@%s", server.Username, server.Host)
    output, err := sshService.ExecuteRemoteCommand(server, dockerCmd) // Pass server config instead of just host
    if err != nil {
        return nil, fmt.Errorf("failed to get containers from %s: %w", server.Host, err)
    }

    containers := s.parseDockerOutput(output)
    s.logger.Infof("Found %d PostgreSQL containers on %s", len(containers), server.Host)
    return containers, nil
}


// getLocalContainers handles local Docker API calls
func (s *DockerService) getLocalContainers(ctx context.Context) ([]models.ContainerResponse, error) {
	cli, err := s.GetDockerClient("")
	if err != nil {
		return nil, err
	}
	defer cli.Close()

	// Test connection
	if _, err := cli.Ping(ctx); err != nil {
		return nil, fmt.Errorf("docker ping failed: %w", err)
	}

	// List all running containers
	containers, err := cli.ContainerList(ctx, types.ContainerListOptions{
		All: false, // Only running containers
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list containers: %w", err)
	}

	s.logger.Infof("Found %d total containers locally", len(containers))
	
	var pgContainers []models.ContainerResponse
	for _, container := range containers {
		s.logger.Debugf("Container: ID=%s Image=%s Names=%v", container.ID[:12], container.Image, container.Names)
		
		// Check if container is PostgreSQL
		if s.isPostgreSQLContainer(container) {
			pgContainer := models.ContainerResponse{
				ID:      container.ID[:12], // Short ID
				Name:    strings.TrimPrefix(container.Names[0], "/"),
				Image:   container.Image,
				Status:  container.Status,
				Ports:   s.formatPorts(container.Ports),
				Labels:  container.Labels,
				Created: time.Unix(container.Created, 0),
			}
			pgContainers = append(pgContainers, pgContainer)
		}
	}

	s.logger.Infof("Found %d PostgreSQL containers locally", len(pgContainers))
	return pgContainers, nil
}

// parseDockerOutput parses the output from docker ps command executed via SSH
func (s *DockerService) parseDockerOutput(output string) []models.ContainerResponse {
    var containers []models.ContainerResponse
    
    lines := strings.Split(strings.TrimSpace(output), "\n")
    for _, line := range lines {
        line = strings.TrimSpace(line)
        if line == "" {
            continue
        }
        
        parts := strings.Split(line, "\t")
        if len(parts) < 4 {
            s.logger.Warnf("Unexpected docker ps output format: %s", line)
            continue
        }
        
        // Check if this is a PostgreSQL container
        image := parts[2]
        name := parts[1]
        if !s.isPostgreSQLContainerSSH(image, name) {
            continue // Skip non-PostgreSQL containers
        }
        
        container := models.ContainerResponse{
            ID:      parts[0],
            Name:    strings.TrimPrefix(parts[1], "/"),
            Image:   parts[2],
            Status:  parts[3],
            Ports:   []string{},
            Labels:  make(map[string]string),
            Created: time.Now(),
        }
        
        if len(parts) >= 5 {
            container.Ports = s.parsePorts(parts[4])
        }
        
        containers = append(containers, container)
    }
    
    s.logger.Infof("Parsed %d PostgreSQL containers from SSH output", len(containers))
    return containers
}

// Add this new method for SSH-based filtering
func (s *DockerService) isPostgreSQLContainerSSH(image, name string) bool {
    // Check image name
    if strings.Contains(strings.ToLower(image), "postgres") {
        return true
    }
    
    // Check container name
    if strings.Contains(strings.ToLower(name), "postgres") {
        return true
    }
    
    return false
}


// parsePorts parses port information from docker ps output
func (s *DockerService) parsePorts(portString string) []string {
	if portString == "" {
		return []string{}
	}
	
	// Simple port parsing - you can make this more sophisticated
	ports := strings.Split(portString, ",")
	var result []string
	for _, port := range ports {
		result = append(result, strings.TrimSpace(port))
	}
	return result
}

// isPostgreSQLContainer checks if a container is running PostgreSQL
func (s *DockerService) isPostgreSQLContainer(container types.Container) bool {
	// Check image name
	if strings.Contains(strings.ToLower(container.Image), "postgres") {
        return true
    }

	// Check container names
	for _, name := range container.Names {
		if strings.Contains(strings.ToLower(name), "postgres") {
			return true
		}
	}

	// Check labels
	if dbType, exists := container.Labels["db.type"]; exists && strings.ToLower(dbType) == "postgresql" {
		return true
	}

	return false
}

// formatPorts formats container ports for display
func (s *DockerService) formatPorts(ports []types.Port) []string {
	var result []string
	for _, port := range ports {
		if port.PublicPort > 0 {
			result = append(result, fmt.Sprintf("%d:%d/%s", port.PublicPort, port.PrivatePort, port.Type))
		} else {
			result = append(result, fmt.Sprintf("%d/%s", port.PrivatePort, port.Type))
		}
	}
	return result
}

// ExecuteCommand executes a command in a Docker container
func (s *DockerService) ExecuteCommand(ctx context.Context, dockerHost, containerID string, cmd []string) (string, error) {
	cli, err := s.GetDockerClient(dockerHost)
	if err != nil {
		return "", err
	}
	defer cli.Close()

	// Create exec configuration
	execConfig := types.ExecConfig{
		AttachStdout: true,
		AttachStderr: true,
		Cmd:          cmd,
	}

	// Create exec instance
	execResp, err := cli.ContainerExecCreate(ctx, containerID, execConfig)
	if err != nil {
		return "", fmt.Errorf("failed to create exec: %w", err)
	}

	// Start exec
	resp, err := cli.ContainerExecAttach(ctx, execResp.ID, types.ExecStartCheck{})
	if err != nil {
		return "", fmt.Errorf("failed to attach to exec: %w", err)
	}
	defer resp.Close()

	// Read output
	output, err := io.ReadAll(resp.Reader)
	if err != nil {
		return "", fmt.Errorf("failed to read exec output: %w", err)
	}

	return string(output), nil
}

// StreamCommand executes a command and returns a reader for streaming output
func (s *DockerService) StreamCommand(ctx context.Context, dockerHost, containerID string, cmd []string) (io.ReadCloser, error) {
	cli, err := s.GetDockerClient(dockerHost)
	if err != nil {
		return nil, err
	}

	// Create exec configuration
	execConfig := types.ExecConfig{
		AttachStdout: true,
		AttachStderr: true,
		Cmd:          cmd,
	}

	// Create exec instance
	execResp, err := cli.ContainerExecCreate(ctx, containerID, execConfig)
	if err != nil {
		cli.Close()
		return nil, fmt.Errorf("failed to create exec: %w", err)
	}

	// Start exec
	resp, err := cli.ContainerExecAttach(ctx, execResp.ID, types.ExecStartCheck{})
	if err != nil {
		cli.Close()
		return nil, fmt.Errorf("failed to attach to exec: %w", err)
	}

	// Return a custom reader that closes both the response and client
	return &dockerStreamReader{
		HijackedResponse: &resp,
		client:          cli,
	}, nil
}

// dockerStreamReader wraps the exec response and Docker client for proper cleanup
type dockerStreamReader struct {
	*types.HijackedResponse
	client *client.Client
}

// Read implements the io.Reader interface
func (r *dockerStreamReader) Read(p []byte) (n int, err error) {
	return r.HijackedResponse.Reader.Read(p)
}

// Close implements the io.Closer interface
func (r *dockerStreamReader) Close() error {
	r.HijackedResponse.Close()
	return r.client.Close()
}

// GetContainerInfo returns detailed information about a container
func (s *DockerService) GetContainerInfo(ctx context.Context, dockerHost, containerID string) (*types.ContainerJSON, error) {
	cli, err := s.GetDockerClient(dockerHost)
	if err != nil {
		return nil, err
	}
	defer cli.Close()

	containerInfo, err := cli.ContainerInspect(ctx, containerID)
	if err != nil {
		return nil, fmt.Errorf("failed to inspect container: %w", err)
	}

	return &containerInfo, nil
}
