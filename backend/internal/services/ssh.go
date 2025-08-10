package services

import (
	"fmt"
	"os/exec"
	"time"

	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/ssh"
    "backend/internal/config"
)

// SSHConfig represents SSH connection configuration
type SSHConfig struct {
	Host       string
	Port       int
	Username   string
	Password   string
	PrivateKey string
}

// SSHService handles SSH operations
type SSHService struct {
	logger *logrus.Logger
}

// NewSSHService creates a new SSH service
func NewSSHService(logger *logrus.Logger) *SSHService {
	return &SSHService{
		logger: logger,
	}
}

// ExecuteRemoteCommand executes a command on a remote server using system SSH
func (s *SSHService) ExecuteRemoteCommand(serverConfig *config.Server, command string) (string, error) {
    // Build SSH connection string with username
    var sshTarget string
    if serverConfig.Username != "" {
        sshTarget = fmt.Sprintf("%s@%s", serverConfig.Username, serverConfig.Host)
    } else {
        sshTarget = serverConfig.Host
    }
    
    s.logger.Infof("Executing command on %s: %s", sshTarget, command)
    
    // Build SSH command with private key
    var cmd *exec.Cmd
    if serverConfig.PrivateKey != "" {
        // Use private key for authentication
        cmd = exec.Command("ssh", "-i", serverConfig.PrivateKey, "-o", "StrictHostKeyChecking=no", sshTarget, command)
    } else {
        // Use default SSH authentication
        cmd = exec.Command("ssh", "-o", "StrictHostKeyChecking=no", sshTarget, command)
    }
    
    output, err := cmd.CombinedOutput()
    if err != nil {
        s.logger.Errorf("SSH command failed on %s: %v\nOutput: %s", sshTarget, err, string(output))
        return "", fmt.Errorf("SSH command failed: %w\nOutput: %s", err, string(output))
    }
    
    s.logger.Debugf("Command output from %s: %s", sshTarget, string(output))
    return string(output), nil
}



// ExecuteCommand executes a command over SSH (keeping for backward compatibility)
func (s *SSHService) ExecuteCommand(client *ssh.Client, command string) (string, error) {
	session, err := client.NewSession()
	if err != nil {
		return "", fmt.Errorf("failed to create SSH session: %w", err)
	}
	defer session.Close()

	output, err := session.CombinedOutput(command)
	if err != nil {
		return "", fmt.Errorf("failed to execute command: %w", err)
	}

	return string(output), nil
}

// TestConnection tests SSH connection to a server
func (s *SSHService) TestConnection(config SSHConfig) error {
	// Simple test using system ssh
	cmd := exec.Command("ssh", "-o", "ConnectTimeout=10", config.Host, "echo 'test'")
	_, err := cmd.CombinedOutput()
	return err
}

// createSSHClient creates an SSH client from SSHConfig (if needed for other operations)
func (s *SSHService) createSSHClient(config SSHConfig) (*ssh.Client, error) {
	var auth []ssh.AuthMethod

	// Use private key if provided
	if config.PrivateKey != "" {
		key, err := ssh.ParsePrivateKey([]byte(config.PrivateKey))
		if err != nil {
			return nil, fmt.Errorf("failed to parse private key: %w", err)
		}
		auth = append(auth, ssh.PublicKeys(key))
	}

	// Use password if provided
	if config.Password != "" {
		auth = append(auth, ssh.Password(config.Password))
	}

	// SSH client configuration
	sshConfig := &ssh.ClientConfig{
		User:            config.Username,
		Auth:            auth,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // In production, use proper host key verification
		Timeout:         30 * time.Second,
	}

	// Connect to the remote server
	address := fmt.Sprintf("%s:%d", config.Host, config.Port)
	client, err := ssh.Dial("tcp", address, sshConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to %s: %w", address, err)
	}

	return client, nil
}