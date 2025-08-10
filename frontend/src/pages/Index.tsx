import { useState } from 'react';
import { Database } from 'lucide-react';
import { Server, Container } from '@/types/api';
import { ServerSelector } from '@/components/ServerSelector';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DatabaseGrid } from '@/components/DatabaseGrid';
import { StatusIndicator } from '@/components/StatusIndicator';
import { HealthWarning } from '@/components/HealthWarning';

const Index = () => {
  const [selectedServer, setSelectedServer] = useState<Server | undefined>();
  const [selectedContainer, setSelectedContainer] = useState<Container | undefined>();

  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
    setSelectedContainer(undefined); // Reset container when server changes
  };

  const handleContainerSelect = (container: Container) => {
    setSelectedContainer(container);
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg shadow-glow">
              <Database className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                PostgreSQL Manager
              </h1>
              <p className="text-muted-foreground">
                Manage your PostgreSQL containers and databases
              </p>
            </div>
          </div>
          <StatusIndicator />
        </div>

        <HealthWarning />

        {/* Server Selection */}
        <ServerSelector 
          onServerSelect={handleServerSelect}
          selectedServer={selectedServer}
        />

        {/* Container Grid */}
        {selectedServer && (
          <ContainerGrid 
            server={selectedServer}
            onContainerSelect={handleContainerSelect}
            selectedContainer={selectedContainer}
          />
        )}

        {/* Database Grid */}
        {selectedServer && selectedContainer && (
          <DatabaseGrid 
            server={selectedServer}
            container={selectedContainer}
          />
        )}

        {/* Instructions when nothing is selected */}
        {!selectedServer && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Get Started</h3>
              <p className="text-muted-foreground">
                Select a server from the dropdown above to view its PostgreSQL containers and manage databases.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
