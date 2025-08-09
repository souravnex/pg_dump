export const API_CONFIG = {
  BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
  ENDPOINTS: {
    HEALTH: '/health',
    SERVERS: '/api/v1/servers',
    CONTAINERS: '/api/v1/servers/:serverID/containers',
    DATABASES: '/api/v1/servers/:serverID/containers/:containerID/databases',
    DUMP: '/api/v1/servers/:serverID/containers/:containerID/databases/:dbName/dump'
  }
};

export const API_TIMEOUT = 30000; // 30 seconds
