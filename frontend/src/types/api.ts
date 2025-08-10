export interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  description?: string;
  status: 'online' | 'offline' | 'pending' | 'unknown';
}

export interface Container {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused' | 'restarting';
  ports: string[];
  created: string;
}

export interface Database {
  name: string;
  owner: string;
  encoding: string;
  size?: string;
}

export interface DumpOptions {
  dataOnly?: boolean;
  schemaOnly?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
}