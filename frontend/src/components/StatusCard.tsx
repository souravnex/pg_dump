import { Server } from '@/types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface ServerSelectorProps {
  servers: Server[];
  selectedServer: Server | null;
  onServerChange: (server: Server | null) => void;
  loading: boolean;
  error: string | undefined;
  onRetry: () => void;
}

export function ServerSelector({
  servers,
  selectedServer,
  onServerChange,
  loading,
  error,
  onRetry
}: ServerSelectorProps) {
  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Select Server</label>
        <ErrorMessage message={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Select Server</label>
      <div className="relative">
        <select
          value={selectedServer?.id || ''}
          onChange={(e) => {
            const server = servers.find(s => s.id === e.target.value) || null;
            onServerChange(server);
          }}
          disabled={loading || servers.length === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        >
          <option value="">
            {loading ? 'Loading servers...' : 'Choose a server'}
          </option>
          {servers.map((server) => (
            <option key={server.id} value={server.id}>
              {server.name} ({server.host})
            </option>
          ))}
        </select>
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>
      {selectedServer && (
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
          <p><strong>Host:</strong> {selectedServer.host}:{selectedServer.port}</p>
          {selectedServer.description && (
            <p><strong>Description:</strong> {selectedServer.description}</p>
          )}
          <p><strong>Status:</strong> 
            <span className={`ml-1 ${selectedServer.status === 'reachable' ? 'text-green-600' : 'text-yellow-600'}`}>
              {selectedServer.status}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
