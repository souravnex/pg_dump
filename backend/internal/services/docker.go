package services

import (
    "context"
    "fmt"
    "io"
    "strings"
    "time"

    "github.com/docker/docker/api/types"
    //"github.com/docker/docker/api/types/container"
    "github.com/docker/docker/client"
    "github.com/sirupsen/logrus"

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

// GetPostgreSQLContainers returns all running PostgreSQL containers
func (s *DockerService) GetPostgreSQLContainers(ctx context.Context, dockerHost string) ([]models.ContainerResponse, error) {
    cli, err := s.GetDockerClient(dockerHost)
    if err != nil {
        return nil, err
    }
    defer cli.Close()

    // List all running containers
    containers, err := cli.ContainerList(ctx, types.ContainerListOptions{
        All: false, // Only running containers
    })
    if err != nil {
        return nil, fmt.Errorf("failed to list containers: %w", err)
    }

    var pgContainers []models.ContainerResponse

    for _, container := range containers {
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

    s.logger.Infof("Found %d PostgreSQL containers", len(pgContainers))
    return pgContainers, nil
}

// isPostgreSQLContainer checks if a container is running PostgreSQL
func (s *DockerService) isPostgreSQLContainer(container types.Container) bool {
    // Check image name
    if strings.Contains(strings.ToLower(container.Image), "postgres") {
        return true
    }

    // Check labels
    if dbType, exists := container.Labels["db.type"]; exists && strings.ToLower(dbType) == "postgresql" {
        return true
    }

    // Check environment variables (this requires inspecting the container)
    // For now, we'll rely on image name and labels
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
    // HijackedResponse.Close() doesn't return an error
    r.HijackedResponse.Close()
    
    // Docker client Close() returns an error
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
