package models

import "time"

// ServerResponse represents a server in API responses
type ServerResponse struct {
    ID          string `json:"id"`
    Name        string `json:"name"`
    Host        string `json:"host"`
    Port        int    `json:"port"`
    Description string `json:"description,omitempty"`
    Status      string `json:"status"`
}

// ContainerResponse represents a PostgreSQL container in API responses
type ContainerResponse struct {
    ID      string            `json:"id"`
    Name    string            `json:"name"`
    Image   string            `json:"image"`
    Status  string            `json:"status"`
    Ports   []string          `json:"ports"`
    Labels  map[string]string `json:"labels,omitempty"`
    Created time.Time         `json:"created"`
}

// DatabaseResponse represents a PostgreSQL database in API responses
type DatabaseResponse struct {
    Name        string `json:"name"`
    Owner       string `json:"owner"`
    Encoding    string `json:"encoding"`
    Size        string `json:"size,omitempty"`
    Description string `json:"description,omitempty"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
    Error   string `json:"error"`
    Message string `json:"message,omitempty"`
    Code    int    `json:"code"`
}

// PostgreSQLConnection represents connection details for PostgreSQL
type PostgreSQLConnection struct {
    Host     string `json:"host"`
    Port     int    `json:"port"`
    Username string `json:"username"`
    Password string `json:"password"`
    Database string `json:"database"`
}

// DumpRequest represents a database dump request
type DumpRequest struct {
    ServerID    string `json:"server_id"`
    ContainerID string `json:"container_id"`
    Database    string `json:"database"`
    Options     struct {
        DataOnly   bool     `json:"data_only"`
        SchemaOnly bool     `json:"schema_only"`
        Tables     []string `json:"tables,omitempty"`
    } `json:"options,omitempty"`
}
