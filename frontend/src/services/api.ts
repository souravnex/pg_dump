import { Server, Container, Database, DumpOptions, ApiResponse, HealthCheck } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}`;
        try {
          if (contentType.includes('application/json')) {
            const errJson = await response.json();
            errorMessage = errJson.message || JSON.stringify(errJson);
          } else {
            const errText = await response.text();
            errorMessage = errText || errorMessage;
          }
        } catch (_) {
          // ignore parse errors
        }
        throw new Error(errorMessage);
      }

      if (contentType.includes('application/json')) {
        return await response.json();
      }

      // @ts-expect-error - allow non-JSON in special cases handled by callers
      return await response.text();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error instanceof Error ? error : new Error('Unknown API error');
    }
  }

  async healthCheck(): Promise<HealthCheck> {
    return this.request<HealthCheck>('/health');
  }

  async getServers(): Promise<Server[]> {
    const res = await this.request<any>('/api/v1/servers');
    if (Array.isArray(res)) return res as Server[];
    if (res && Array.isArray(res.servers)) return res.servers as Server[];
    // Some backends wrap data differently
    if (res && res.data && Array.isArray(res.data.servers)) return res.data.servers as Server[];
    throw new Error('Unexpected servers response shape');
  }

  async getContainers(serverId: string): Promise<Container[]> {
    const res = await this.request<any>(`/api/v1/servers/${serverId}/containers`);
    if (Array.isArray(res)) return res as Container[];
    if (res && Array.isArray(res.containers)) return res.containers as Container[];
    if (res && res.data && Array.isArray(res.data.containers)) return res.data.containers as Container[];
    throw new Error('Unexpected containers response shape');
  }

  async getDatabases(serverId: string, containerId: string): Promise<Database[]> {
    const res = await this.request<any>(`/api/v1/servers/${serverId}/containers/${containerId}/databases`);
    if (Array.isArray(res)) return res as Database[];
    if (res && Array.isArray(res.databases)) return res.databases as Database[];
    if (res && res.data && Array.isArray(res.data.databases)) return res.data.databases as Database[];
    throw new Error('Unexpected databases response shape');
  }

  async downloadDump(
    serverId: string,
    containerId: string,
    dbName: string,
    options?: DumpOptions
  ): Promise<Blob> {
    const params = new URLSearchParams();
    if (options?.dataOnly) params.append('data_only', 'true');
    if (options?.schemaOnly) params.append('schema_only', 'true');

    const queryString = params.toString();
    const endpoint = `/api/v1/servers/${serverId}/containers/${containerId}/databases/${dbName}/dump${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      let message = `Download failed: ${response.status}`;
      try {
        const text = await response.text();
        if (text) message = text;
      } catch (_) {}
      throw new Error(message);
    }

    return response.blob();
  }
}

export const apiService = new ApiService();