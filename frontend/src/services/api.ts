import { API_CONFIG, API_TIMEOUT } from '@/config/api.config';
import { Server, Container, Database, ServersResponse, ContainersResponse, DatabasesResponse, ErrorResponse } from '@/types';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData: ErrorResponse = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Use default error message if JSON parsing fails
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string }> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.HEALTH}`);
    return this.handleResponse(response);
  }

  async getServers(): Promise<ServersResponse> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.SERVERS}`);
    return this.handleResponse(response);
  }

  async getContainers(serverId: string): Promise<ContainersResponse> {
    const url = `${this.baseUrl}${API_CONFIG.ENDPOINTS.CONTAINERS.replace(':serverID', serverId)}`;
    const response = await this.fetchWithTimeout(url);
    return this.handleResponse(response);
  }

  async getDatabases(serverId: string, containerId: string): Promise<DatabasesResponse> {
    const url = `${this.baseUrl}${API_CONFIG.ENDPOINTS.DATABASES
      .replace(':serverID', serverId)
      .replace(':containerID', containerId)}`;
    const response = await this.fetchWithTimeout(url);
    return this.handleResponse(response);
  }

  async downloadDump(
    serverId: string, 
    containerId: string, 
    dbName: string, 
    options?: { data_only?: boolean; schema_only?: boolean }
  ): Promise<Blob> {
    const baseUrl = `${this.baseUrl}${API_CONFIG.ENDPOINTS.DUMP
      .replace(':serverID', serverId)
      .replace(':containerID', containerId)
      .replace(':dbName', dbName)}`;
    
    const params = new URLSearchParams();
    if (options?.data_only) params.append('data_only', 'true');
    if (options?.schema_only) params.append('schema_only', 'true');
    
    const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    
    const response = await this.fetchWithTimeout(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to download dump: ${response.statusText}`);
    }

    return response.blob();
  }
}

export const apiService = new ApiService();
