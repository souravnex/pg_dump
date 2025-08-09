import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { useApi, useAsyncCall } from '@/hooks/useApi';
import { useToast } from '@/hooks/useToast';
import { Server, Container, Database } from '@/types';
import { downloadBlob, generateDumpFilename } from '@/utils/download';

import { ServerSelector } from '@/components/ServerSelector';
import { ContainerSelector } from '@/components/ContainerSelector';
import { DatabaseSelector } from '@/components/DatabaseSelector';
import { DownloadButton } from '@/components/DownloadButton';
import { ToastContainer } from '@/components/ToastNotification';
import { ErrorMessage } from '@/components/ErrorMessage';

function App() {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);

  const { toasts, removeToast, showSuccess, showError } = useToast();

  // Fetch servers on component mount
  const { 
    data: serversData, 
    loading: serversLoading, 
    error: serversError, 
    refetch: refetchServers 
  } = useApi(() => apiService.getServers());

  // Fetch containers when server is selected
  const { 
    data: containersData, 
    loading: containersLoading, 
    error: containersError, 
    refetch: refetchContainers 
  } = useApi(
    () => selectedServer ? apiService.getContainers(selectedServer.id) : Promise.resolve({ containers: [], server_id: '', total: 0 }),
    [selectedServer?.id]
  );

  // Fetch databases when container is selected
  const { 
    data: databasesData, 
    loading: databasesLoading, 
    error: databasesError, 
    refetch: refetchDatabases 
  } = useApi(
    () => selectedServer && selectedContainer 
      ? apiService.getDatabases(selectedServer.id, selectedContainer.id) 
      : Promise.resolve({ databases: [], server_id: '', container_id: '', total: 0 }),
    [selectedServer?.id, selectedContainer?.id]
  );

  // Download dump functionality
  const { execute: executeDownload, loading: downloadLoading, error: downloadError } = useAsyncCall();

  // Reset selections when parent selections change
  useEffect(() => {
    setSelectedContainer(null);
    setSelectedDatabase(null);
  }, [selectedServer]);

  useEffect(() => {
    setSelectedDatabase(null);
  }, [selectedContainer]);

  const handleDownload = async (options: { data_only: boolean; schema_only: boolean }) => {
    if (!selectedServer || !selectedContainer || !selectedDatabase) {
      showError('Selection Error', 'Please select server, container, and database');
      return;
    }

    try {
      const blob = await executeDownload(() => 
        apiService.downloadDump(
          selectedServer.id, 
          selectedContainer.id, 
          selectedDatabase.name,
          options.data_only || options.schema_only ? options : undefined
        )
      );

      const filename = generateDumpFilename(
        selectedServer.id,
        selectedContainer.name,
        selectedDatabase.name,
        options
      );

      downloadBlob(blob, filename);
      showSuccess(
        'Download Complete', 
        `Successfully downloaded ${selectedDatabase.name} dump`
      );
    } catch (error) {
      showError(
        'Download Failed', 
        error instanceof Error ? error.message : 'Failed to download database dump'
      );
    }
  };

  const servers = serversData?.servers || [];
  const containers = containersData?.containers || [];
  const databases = databasesData?.databases || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">PostgreSQL Database Manager</h1>
          <p className="text-gray-600 mt-1">Select a server, container, and database to download SQL dumps</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Server Selection */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <ServerSelector
              servers={servers}
              selectedServer={selectedServer}
              onServerChange={setSelectedServer}
              loading={serversLoading}
              error={serversError}
              onRetry={refetchServers}
            />
          </div>

          {/* Container Selection */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <ContainerSelector
              containers={containers}
              selectedContainer={selectedContainer}
              onContainerChange={setSelectedContainer}
              loading={containersLoading}
              error={containersError}
              onRetry={refetchContainers}
              disabled={!selectedServer}
            />
          </div>

          {/* Database Selection */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <DatabaseSelector
              databases={databases}
              selectedDatabase={selectedDatabase}
              onDatabaseChange={setSelectedDatabase}
              loading={databasesLoading}
              error={databasesError}
              onRetry={refetchDatabases}
              disabled={!selectedContainer}
            />
          </div>

          {/* Download Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Download Database Dump</h3>
            
            {downloadError && (
              <div className="mb-4">
                <ErrorMessage message={downloadError} />
              </div>
            )}

            <DownloadButton
              onDownload={handleDownload}
              disabled={!selectedDatabase}
              loading={downloadLoading}
            />

            {selectedDatabase && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <p><strong>Ready to download:</strong> {selectedDatabase.name}</p>
                <p><strong>From:</strong> {selectedContainer?.name} on {selectedServer?.name}</p>
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  selectedServer ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span>Server: {selectedServer ? 'Connected' : 'Not selected'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  selectedContainer ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span>Container: {selectedContainer ? 'Connected' : 'Not selected'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  selectedDatabase ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span>Database: {selectedDatabase ? 'Selected' : 'Not selected'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
