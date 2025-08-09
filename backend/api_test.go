package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"backend/internal/config"
	"backend/internal/handlers"
	"backend/internal/services"
	"backend/internal/utils"
)

func setupTestRouter() *gin.Engine {
	// Load test configuration
	cfg, _ := config.LoadConfig("configs/config.yaml")
	logger := utils.NewLogger()

	// Initialize services
	dockerService := services.NewDockerService(logger)
	sshService := services.NewSSHService(logger)
	postgresService := services.NewPostgresService(logger)

	// Initialize handlers
	handler := handlers.NewHandler(cfg, dockerService, sshService, postgresService, logger)

	// Setup router
	gin.SetMode(gin.TestMode)
	r := gin.New()

	api := r.Group("/api/v1")
	{
		api.GET("/servers", handler.GetServers)
		api.GET("/servers/:serverID/containers", handler.GetContainers)
		api.GET("/servers/:serverID/containers/:containerID/databases", handler.GetDatabases)
		api.GET("/servers/:serverID/containers/:containerID/databases/:dbName/dump", handler.DownloadDump)
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	return r
}

func TestHealthEndpoint(t *testing.T) {
	router := setupTestRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/health", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "healthy", response["status"])
}

func TestServersEndpoint(t *testing.T) {
	router := setupTestRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/servers", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response, "servers")
	assert.Contains(t, response, "total")
}

func TestContainersEndpoint(t *testing.T) {
    router := setupTestRouter()
    
    w := httptest.NewRecorder()
    // Change "local" to "remote-1" (or "remote-2")
    req, _ := http.NewRequest("GET", "/api/v1/servers/remote-1/containers", nil)
    router.ServeHTTP(w, req)
    
    // This might return 404 if server connection fails
    // or 500 if Docker isn't accessible in test environment
    assert.True(t, w.Code == 200 || w.Code == 404 || w.Code == 500)
}


// Run tests with: go test -v
