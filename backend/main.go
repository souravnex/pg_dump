package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"backend/internal/config"
	"backend/internal/handlers"
	"backend/internal/services"
	"backend/internal/utils"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize logger
	logger := utils.NewLogger()

	// Load configuration
	cfg, err := config.LoadConfig("configs/config.yaml")
	if err != nil {
		logger.Fatalf("Failed to load config: %v", err)
	}

	// Initialize services
	dockerService := services.NewDockerService(logger)
	sshService := services.NewSSHService(logger)
	postgresService := services.NewPostgresService(logger)

	// Initialize handlers
	handler := handlers.NewHandler(cfg, dockerService, sshService, postgresService, logger)

    r := gin.Default()

    // Add CORS middleware if needed
    r.Use(func(c *gin.Context) {
        c.Header("Access-Control-Allow-Origin", "*")
        c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        c.Next()
    })

    // Health check endpoint - ADD THIS BEFORE API ROUTES
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "status":    "healthy",
            "timestamp": time.Now().Unix(),
            "service":   "postgres-manager-backend",
        })
    })

    // API routes
    api := r.Group("/api/v1")
    {
        api.GET("/servers", handler.GetServers)
        api.GET("/servers/:serverID/containers", handler.GetContainers)
        api.GET("/servers/:serverID/containers/:containerID/databases", handler.GetDatabases)
        api.GET("/servers/:serverID/containers/:containerID/databases/:dbName/dump", handler.DownloadDump)
        api.GET("/servers/:serverID/host/databases", handler.GetHostDatabases)
        api.GET("/servers/:serverID/host/databases/:dbName/dump", handler.DownloadHostDump)
    }

    // Start server
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    logger.Infof("Starting server on port %s", port)
    if err := r.Run("0.0.0.0:" + port); err != nil {
        logger.Fatalf("Failed to start server: %v", err)
    }
}
