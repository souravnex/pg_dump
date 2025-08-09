package services

import (
    "fmt"
    "io"
    "net"
    "os"
    "time"

    "golang.org/x/crypto/ssh"
    "github.com/sirupsen/logrus"
)

// SSHService handles SSH connections
type SSHService struct {
    logger *logrus.Logger
}

// NewSSHService creates a new SSH service
func NewSSHService(logger *logrus.Logger) *SSHService {
    return &SSHService{
        logger: logger,
    }
}

// SSHConfig represents SSH connection configuration
type SSHConfig struct {
    Host       string
    Port       int
    Username   string
    Password   string
    PrivateKey string
}

// Connect establishes an SSH connection
func (s *SSHService) Connect(config SSHConfig) (*ssh.Client, error) {
    // Build SSH client configuration
    sshConfig := &ssh.ClientConfig{
        User:            config.Username,
        HostKeyCallback: ssh.InsecureIgnoreHostKey(), // Note: In production, use proper host key verification
        Timeout:         30 * time.Second,
    }

    // Add authentication methods
    if config.Password != "" {
        sshConfig.Auth = append(sshConfig.Auth, ssh.Password(config.Password))
    }

    if config.PrivateKey != "" {
        key, err := s.loadPrivateKey(config.PrivateKey)
        if err != nil {
            return nil, fmt.Errorf("failed to load private key: %w", err)
        }
        sshConfig.Auth = append(sshConfig.Auth, ssh.PublicKeys(key))
    }

    // Connect to SSH server
    addr := fmt.Sprintf("%s:%d", config.Host, config.Port)
    client, err := ssh.Dial("tcp", addr, sshConfig)
    if err != nil {
        return nil, fmt.Errorf("failed to connect to SSH server: %w", err)
    }

    s.logger.Infof("Successfully connected to SSH server %s", addr)
    return client, nil
}

// loadPrivateKey loads a private key from file or string
func (s *SSHService) loadPrivateKey(keyPath string) (ssh.Signer, error) {
    var keyData []byte
    var err error

    // Check if it's a file path or key content
    if _, err := os.Stat(keyPath); err == nil {
        // It's a file path
        keyData, err = os.ReadFile(keyPath)
        if err != nil {
            return nil, fmt.Errorf("failed to read private key file: %w", err)
        }
    } else {
        // Treat as key content
        keyData = []byte(keyPath)
    }

    // Parse the private key
    key, err := ssh.ParsePrivateKey(keyData)
    if err != nil {
        return nil, fmt.Errorf("failed to parse private key: %w", err)
    }

    return key, nil
}

// ExecuteCommand executes a command over SSH
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

// TestConnection tests SSH connection
func (s *SSHService) TestConnection(config SSHConfig) error {
    client, err := s.Connect(config)
    if err != nil {
        return err
    }
    defer client.Close()

    // Test with a simple command
    _, err = s.ExecuteCommand(client, "echo 'SSH connection test successful'")
    return err
}

// CreateTunnel creates an SSH tunnel for Docker API access
func (s *SSHService) CreateTunnel(client *ssh.Client, localPort int, remoteHost string, remotePort int) (net.Listener, error) {
    // Listen on local port
    localAddr := fmt.Sprintf("localhost:%d", localPort)
    listener, err := net.Listen("tcp", localAddr)
    if err != nil {
        return nil, fmt.Errorf("failed to listen on local port: %w", err)
    }

    remoteAddr := fmt.Sprintf("%s:%d", remoteHost, remotePort)
    
    go func() {
        for {
            // Accept local connections
            localConn, err := listener.Accept()
            if err != nil {
                s.logger.Errorf("Failed to accept local connection: %v", err)
                return
            }

            // Create remote connection through SSH
            remoteConn, err := client.Dial("tcp", remoteAddr)
            if err != nil {
                s.logger.Errorf("Failed to dial remote address: %v", err)
                localConn.Close()
                continue
            }

            // Start copying data between connections
            go s.copyConn(localConn, remoteConn)
            go s.copyConn(remoteConn, localConn)
        }
    }()

    s.logger.Infof("SSH tunnel created: %s -> %s", localAddr, remoteAddr)
    return listener, nil
}

// copyConn copies data between two connections
func (s *SSHService) copyConn(dst, src net.Conn) {
    defer dst.Close()
    defer src.Close()
    
    _, err := io.Copy(dst, src)
    if err != nil {
        s.logger.Debugf("Connection copy ended: %v", err)
    }
}
