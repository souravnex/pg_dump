package handlers

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"backend/internal/config"
	"backend/internal/models"
	"backend/internal/services"
)

// Handler contains all HTTP handlers
type Handler struct {
	config          *config.Config
	dockerService   *services.DockerService
	sshService      *services.SSHService
	postgresService *services.PostgresService
	logger          *logrus.Logger
}

// NewHandler creates a new handler instance
func NewHandler(
	cfg *config.Config,
	dockerService *services.DockerService,
	sshService *services.SSHService,
	postgresService *services.PostgresService,
	logger *logrus.Logger,
) *Handler {
	return &Handler{
		config:          cfg,
		dockerService:   dockerService,
		sshService:      sshService,
		postgresService: postgresService,
		logger:          logger,
	}
}

// GetServers returns list of available servers
func (h *Handler) GetServers(c *gin.Context) {
	var servers []models.ServerResponse

	for _, server := range h.config.Servers {
		serverResp := models.ServerResponse{
			ID:          server.ID,
			Name:        server.Name,
			Host:        server.Host,
			Port:        server.Port,
			Description: server.Description,
			Status:      "unknown", // We'll check this in real-time if needed
		}

		// Optional: Test connection to determine status
		// This might slow down the response, so consider making it optional
		servers = append(servers, serverResp)
	}

	c.JSON(http.StatusOK, gin.H{
		"servers": servers,
		"total":   len(servers),
	})
}

// GetContainers returns PostgreSQL containers on a specific server
func (h *Handler) GetContainers(c *gin.Context) {
	serverID := c.Param("serverID")

	server, err := h.config.GetServerByID(serverID)
	if err != nil {
		h.logger.Errorf("Server not found: %v", err)
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Error:   "Server not found",
			Message: err.Error(),
			Code:    http.StatusNotFound,
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Get Docker host (use SSH tunnel if needed)
	dockerHost := server.DockerHost
	if dockerHost == "" {
		dockerHost = h.config.Docker.DefaultHost
	}

	// Get PostgreSQL containers
	containers, err := h.dockerService.GetPostgreSQLContainers(ctx, dockerHost)
	if err != nil {
		h.logger.Errorf("Failed to get containers: %v", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to get containers",
			Message: err.Error(),
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"containers": containers,
		"server_id":  serverID,
		"total":      len(containers),
	})
}

// GetDatabases returns databases in a specific PostgreSQL container
func (h *Handler) GetDatabases(c *gin.Context) {
	serverID := c.Param("serverID")
	containerID := c.Param("containerID")

	server, err := h.config.GetServerByID(serverID)
	if err != nil {
		h.logger.Errorf("Server not found: %v", err)
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Error:   "Server not found",
			Message: err.Error(),
			Code:    http.StatusNotFound,
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Get Docker host
	dockerHost := server.DockerHost
	if dockerHost == "" {
		dockerHost = h.config.Docker.DefaultHost
	}

	// Get databases
	databases, err := h.postgresService.GetDatabases(ctx, dockerHost, containerID)
	if err != nil {
		h.logger.Errorf("Failed to get databases: %v", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to get databases",
			Message: err.Error(),
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"databases":    databases,
		"server_id":    serverID,
		"container_id": containerID,
		"total":        len(databases),
	})
}

// DownloadDump creates and downloads a PostgreSQL database dump
func (h *Handler) DownloadDump(c *gin.Context) {
	serverID := c.Param("serverID")
	containerID := c.Param("containerID")
	dbName := c.Param("dbName")

	server, err := h.config.GetServerByID(serverID)
	if err != nil {
		h.logger.Errorf("Server not found: %v", err)
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Error:   "Server not found",
			Message: err.Error(),
			Code:    http.StatusNotFound,
		})
		return
	}

	// Parse query parameters for dump options
	options := make(map[string]interface{})

	if dataOnly := c.Query("data_only"); dataOnly != "" {
		if val, err := strconv.ParseBool(dataOnly); err == nil {
			options["data_only"] = val
		}
	}

	if schemaOnly := c.Query("schema_only"); schemaOnly != "" {
		if val, err := strconv.ParseBool(schemaOnly); err == nil {
			options["schema_only"] = val
		}
	}

	ctx := context.Background() // Don't set timeout for dump operations

	// Get Docker host
	dockerHost := server.DockerHost
	if dockerHost == "" {
		dockerHost = h.config.Docker.DefaultHost
	}

	h.logger.Infof("Creating dump for database %s in container %s", dbName, containerID)

	// Create dump stream
	dumpReader, err := h.postgresService.CreateDump(ctx, dockerHost, containerID, dbName, options)
	if err != nil {
		h.logger.Errorf("Failed to create dump: %v", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to create dump",
			Message: err.Error(),
			Code:    http.StatusInternalServerError,
		})
		return
	}
	defer dumpReader.Close()

	// Set response headers for file download
	filename := fmt.Sprintf("%s_%s_%s.sql", serverID, containerID[:8], dbName)
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Header("Content-Type", "application/sql")
	c.Header("Content-Transfer-Encoding", "binary")

	// Stream the dump to the client
	c.Stream(func(w io.Writer) bool {
		buffer := make([]byte, 4096)
		n, err := dumpReader.Read(buffer)
		if err != nil {
			if err != io.EOF {
				h.logger.Errorf("Error reading dump: %v", err)
			}
			return false
		}

		_, err = w.Write(buffer[:n])
		return err == nil
	})
}

// Additional helper methods

// CheckServerStatus checks if a server is accessible
func (h *Handler) CheckServerStatus(c *gin.Context) {
	serverID := c.Param("serverID")

	server, err := h.config.GetServerByID(serverID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Error:   "Server not found",
			Message: err.Error(),
			Code:    http.StatusNotFound,
		})
		return
	}

	// Test SSH connection if SSH is configured
	if server.Username != "" {
		sshConfig := services.SSHConfig{
			Host:       server.Host,
			Port:       server.Port,
			Username:   server.Username,
			Password:   server.Password,
			PrivateKey: server.PrivateKey,
		}

		if err := h.sshService.TestConnection(sshConfig); err != nil {
			c.JSON(http.StatusOK, gin.H{
				"server_id": serverID,
				"status":    "unreachable",
				"error":     err.Error(),
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"server_id": serverID,
		"status":    "reachable",
	})
}
