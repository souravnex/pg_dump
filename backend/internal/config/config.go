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
    ID          string `yaml:"id"`
    Name        string `yaml:"name"`
    Host        string `yaml:"host"`
    Port        int    `yaml:"port"`
    Username    string `yaml:"username"`
    Password    string `yaml:"password,omitempty"`
    PrivateKey  string `yaml:"private_key,omitempty"`
    DockerHost  string `yaml:"docker_host,omitempty"`
    Description string `yaml:"description,omitempty"`
}

// Docker represents Docker configuration
type Docker struct {
    DefaultHost string `yaml:"default_host"`
    TLSVerify   bool   `yaml:"tls_verify"`
    CertPath    string `yaml:"cert_path,omitempty"`
}

// LoadConfig loads configuration from YAML file
func LoadConfig(filename string) (*Config, error) {
    data, err := os.ReadFile(filename)
    if err != nil {
        return nil, fmt.Errorf("failed to read config file: %w", err)
    }

    var config Config
    if err := yaml.Unmarshal(data, &config); err != nil {
        return nil, fmt.Errorf("failed to unmarshal config: %w", err)
    }

    // Replace environment variables in sensitive fields
    for i := range config.Servers {
        if config.Servers[i].Password != "" && config.Servers[i].Password[0] == '$' {
            config.Servers[i].Password = os.Getenv(config.Servers[i].Password[1:])
        }
        if config.Servers[i].PrivateKey != "" && config.Servers[i].PrivateKey[0] == '$' {
            config.Servers[i].PrivateKey = os.Getenv(config.Servers[i].PrivateKey[1:])
        }
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
