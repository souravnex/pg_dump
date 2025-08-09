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


// Instructions to connect with backend:
// 1. Start your backend server on http://localhost:8080
// 2. Ensure CORS is enabled for frontend origin
// 3. Implement the following endpoints:
//    - GET /servers
//    - GET /servers/:serverID/containers  
//    - GET /servers/:serverID/containers/:containerID/databases
//    - GET /servers/:serverID/containers/:containerID/databases/:dbName/dump
// 4. Update BASE_URL in this file if backend runs on different port