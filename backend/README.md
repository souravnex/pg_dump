# PostgreSQL Container Manager

A Go backend service that connects to remote servers via SSH/Docker API to manage PostgreSQL containers and create database dumps.

## Features

- 🐳 **Docker Integration**: Connect to Docker daemons on remote servers
- 🔐 **SSH Support**: Secure connections to remote servers
- 🗄️ **PostgreSQL Management**: List containers, databases, and create dumps
- 📁 **File Streaming**: Stream database dumps without saving to disk
- ⚙️ **Flexible Configuration**: YAML-based server configuration
- 🏗️ **Clean Architecture**: Modular design with separation of concerns
- 📝 **Comprehensive Logging**: Structured logging with configurable levels
- 🐳 **Docker Ready**: Containerized deployment support

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/servers` | List all configured servers |
| `GET` | `/api/v1/servers/{serverID}/containers` | List PostgreSQL containers on server |
| `GET` | `/api/v1/servers/{serverID}/containers/{containerID}/databases` | List databases in container |
| `GET` | `/api/v1/servers/{serverID}/containers/{containerID}/databases/{dbName}/dump` | Download database dump |
| `GET` | `/health` | Health check endpoint |

## Quick Start

### Prerequisites

- Go 1.21+
- Docker (for containerized deployment)
- PostgreSQL containers to manage

### Local Development

1. **Clone the repository**
