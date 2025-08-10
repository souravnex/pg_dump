package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

// Config represents the application configuration
type Config struct {
	Servers []Server `yaml:"servers"`
	Docker  Docker   `yaml:"docker"`
}

// Server represents a server configuration
type Server struct {
	ID           string `yaml:"id"`
	Name         string `yaml:"name"`
	Host         string `yaml:"host"`
	Port         int    `yaml:"port"`
	Username     string `yaml:"username"`
	PostgresUser string `yaml:"postgres_user"`
	Password     string `yaml:"password"`
	PrivateKey   string `yaml:"private_key"`
	DockerHost   string `yaml:"docker_host"`
	Description  string `yaml:"description"`
}

// Docker represents Docker configuration
type Docker struct {
	DefaultHost string `yaml:"default_host"`
	TLSVerify   bool   `yaml:"tls_verify"`
}

// LoadConfig loads configuration from a YAML file
func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return &config, nil
}

// GetServerByID returns a server by its ID
func (c *Config) GetServerByID(id string) (*Server, error) {
	for _, server := range c.Servers {
		if server.ID == id {
			return &server, nil
		}
	}
	return nil, fmt.Errorf("server with ID %s not found", id)
}
