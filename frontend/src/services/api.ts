import { Server, Container, Database, DumpOptions } from '@/types/api';

// Define the response interfaces here since they're missing
interface ServerListResponse {
  servers: Server[];
  total: number;
}

interface ContainerListResponse {
  containers: Container[];
  server_id: string;
  total: number;
}

interface DatabaseListResponse {
  databases: Database[];
  server_id: string;
  container_id?: string;
  type?: string;
  total: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

class ApiService {
  private baseURL = `${API_BASE_URL}/api/v1`;

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async downloadFile(endpoint: string, filename: string): Promise<void> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  async getServers(): Promise<Server[]> {
    const response = await this.request<ServerListResponse>('/servers');
    return response.servers;
  }

  async getContainers(serverId: string): Promise<Container[]> {
    const response = await this.request<ContainerListResponse>(`/servers/${serverId}/containers`);
    return response.containers;
  }

  async getDatabases(serverId: string, containerId: string): Promise<Database[]> {
    const response = await this.request<DatabaseListResponse>(`/servers/${serverId}/containers/${containerId}/databases`);
    return response.databases;
  }

  async downloadDump(serverId: string, containerId: string, dbName: string, options?: DumpOptions): Promise<void> {
    const params = new URLSearchParams();
    if (options?.dataOnly) params.append('data_only', 'true');
    if (options?.schemaOnly) params.append('schema_only', 'true');
    
    const queryString = params.toString();
    const url = `/servers/${serverId}/containers/${containerId}/databases/${dbName}/dump${queryString ? `?${queryString}` : ''}`;
    
    await this.downloadFile(url, `${serverId}_${containerId}_${dbName}.sql`);
  }

  // Host database methods
  async getHostDatabases(serverId: string): Promise<Database[]> {
    const response = await this.request<DatabaseListResponse>(`/servers/${serverId}/host/databases`);
    return response.databases;
  }

  async downloadHostDump(serverId: string, dbName: string, options?: DumpOptions): Promise<void> {
    const params = new URLSearchParams();
    if (options?.dataOnly) params.append('data_only', 'true');
    if (options?.schemaOnly) params.append('schema_only', 'true');
    
    const queryString = params.toString();
    const url = `/servers/${serverId}/host/databases/${dbName}/dump${queryString ? `?${queryString}` : ''}`;
    
    await this.downloadFile(url, `${serverId}_host_${dbName}.sql`);
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Re-export types for convenience
export type { Server, Container, Database, DumpOptions } from '@/types/api';
