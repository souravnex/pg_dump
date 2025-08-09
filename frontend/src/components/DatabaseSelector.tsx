import { Database } from '@/types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { Database as DatabaseIcon, User, FileType } from 'lucide-react';

interface DatabaseSelectorProps {
  databases: Database[];
  selectedDatabase: Database | null;
  onDatabaseChange: (database: Database | null) => void;
  loading: boolean;
  error: string | undefined;
  onRetry: () => void;
  disabled?: boolean;
}

export function DatabaseSelector({
  databases,
  selectedDatabase,
  onDatabaseChange,
  loading,
  error,
  onRetry,
  disabled = false
}: DatabaseSelectorProps) {
  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Select Database</label>
        <ErrorMessage message={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Select Database</label>
      <div className="relative">
        <select
          value={selectedDatabase?.name || ''}
          onChange={(e) => {
            const database = databases.find(d => d.name === e.target.value) || null;
            onDatabaseChange(database);
          }}
          disabled={loading || databases.length === 0 || disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        >
          <option value="">
            {loading ? 'Loading databases...' : 
             disabled ? 'Select a container first' : 
             databases.length === 0 ? 'No databases found' : 
             'Choose a database'}
          </option>
          {databases.map((database) => (
            <option key={database.name} value={database.name}>
              {database.name}
              {database.size && ` (${database.size})`}
            </option>
          ))}
        </select>
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>
      {selectedDatabase && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded space-y-2">
          <div className="flex items-center gap-2">
            <DatabaseIcon className="w-4 h-4" />
            <strong>{selectedDatabase.name}</strong>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>Owner: {selectedDatabase.owner}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <FileType className="w-3 h-3" />
              <span>Encoding: {selectedDatabase.encoding}</span>
            </div>
          </div>
          
          {selectedDatabase.size && (
            <p><strong>Size:</strong> {selectedDatabase.size}</p>
          )}
          
          {selectedDatabase.description && (
            <p><strong>Description:</strong> {selectedDatabase.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
