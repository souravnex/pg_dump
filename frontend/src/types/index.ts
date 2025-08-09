export interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  description?: string;
  status: string;
}

export interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string[];
  labels?: Record<string, string>;
  created: string;
}

export interface Database {
  name: string;
  owner: string;
  encoding: string;
  size?: string;
  description?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

export interface ServersResponse {
  servers: Server[];
  total: number;
}

export interface ContainersResponse {
  containers: Container[];
  server_id: string;
  total: number;
}

export interface DatabasesResponse {
  databases: Database[];
  server_id: string;
  container_id: string;
  total: number;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  code: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}
