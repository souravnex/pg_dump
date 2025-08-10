export interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  description: string;
  status: string;
}

export interface Container {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused' | 'restarting';
  ports: string[];
  labels: Record<string, string>;
  created: string;
}

export interface Database {
  name: string;
  owner: string;
  encoding: string;
  size: string;
}

export interface DumpOptions {
  dataOnly?: boolean;
  schemaOnly?: boolean;
  type?: 'full' | 'schema' | 'data';
  fileName?: string;
}

export interface ApiResponse<T = any> {
   T;
  message?: string;
  success: boolean;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
  uptime?: number;
}

// Response interfaces
export interface ServerListResponse {
  servers: Server[];
  total: number;
}

export interface ContainerListResponse {
  containers: Container[];
  server_id: string;
  total: number;
}

export interface DatabaseListResponse {
  databases: Database[];
  server_id: string;
  container_id?: string;
  type?: string;
  total: number;
}
