import { useState, useEffect } from 'react';
import { Server, Container, Database as DatabaseType } from '@/types/api';
import { ServerSelector } from '@/components/ServerSelector';
import { ServerDatabaseView } from '@/components/ServerDatabaseView';
import { apiService } from '@/services/api';
import { Database as DatabaseIcon, Server as ServerIcon, Zap, Box as ContainerIcon } from 'lucide-react';

// ServerInfoCard Component
function ServerInfoCard({ server }: { server: Server }) {
  const [containerCount, setContainerCount] = useState<number>(0);
  const [hostDatabaseCount, setHostDatabaseCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setIsLoading(true);
        const [containers, hostDatabases] = await Promise.all([
          apiService.getContainers(server.id),
          apiService.getHostDatabases(server.id)
        ]);
        setContainerCount(containers.length);
        setHostDatabaseCount(hostDatabases.length);
      } catch (error) {
        console.error('Failed to fetch server stats:', error);
        setContainerCount(0);
        setHostDatabaseCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, [server.id]);

  return (
    <div className="rounded-xl shadow-lg p-4 h-full border-2 border-purple-400" style={{ backgroundColor: 'rgba(239, 224, 255, 0.42)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-md">
            <ServerIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 text-base">{server.name}</h3>
            <p className="text-xs text-purple-700">Server Overview</p>
          </div>
        </div>
        
        <div className={`px-2 py-1 rounded-lg text-xs font-medium shadow-sm ${
          server.status === 'online' 
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
            : server.status === 'offline'
            ? 'bg-red-100 text-red-700 border border-red-200'
            : 'bg-amber-100 text-amber-700 border border-amber-200'
        }`}>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${
              server.status === 'online' ? 'bg-emerald-500' 
              : server.status === 'offline' ? 'bg-red-500'
              : 'bg-amber-500'
            }`}></div>
            {server.status}
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <div className="animate-pulse bg-slate-200 h-12 rounded-lg"></div>
            <div className="animate-pulse bg-slate-200 h-12 rounded-lg"></div>
          </div>
        ) : (
          <>
            {/* PostgreSQL Containers */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded-md">
                    <ContainerIcon className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-900 text-sm">PostgreSQL Containers</p>
                    <p className="text-xs text-purple-700">Running instances</p>
                  </div>
                </div>
                <div className="text-lg font-bold text-purple-600">{containerCount}</div>
              </div>
            </div>
            
            {/* Host Databases */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded-md">
                    <DatabaseIcon className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-900 text-sm">Host Databases</p>
                    <p className="text-xs text-purple-700">Direct connections</p>
                  </div>
                </div>
                <div className="text-lg font-bold text-purple-600">{hostDatabaseCount}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Enhanced Heading Section */}
        <div className="text-center space-y-4 py-8">
          {/* Logo and Title */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
              <DatabaseIcon className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                PostgreSQL Manager
              </h1>
              <p className="text-slate-500 text-lg font-medium">Database Management Made Simple</p>
            </div>
          </div>
          
          {/* Subtitle */}
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Manage your PostgreSQL databases across multiple servers with ease. 
            Monitor containers, download dumps, and access both containerized and host databases.
          </p>
          
          {/* Feature Pills */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
              <ServerIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Multi-Server</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
              <DatabaseIcon className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Container & Host</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Real-time</span>
            </div>
          </div>
        </div>
        
        {/* Server Selection - Always centered when no server selected */}
        {!selectedServer ? (
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <ServerSelector
                onServerSelect={setSelectedServer}
                selectedServer={selectedServer}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Server Selection and Server Info - Responsive side by side with equal heights */}
            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
              {/* Server Selection - 75% width on large screens */}
              <div className="flex-1 lg:flex-[0.75]">
                <ServerSelector
                  onServerSelect={setSelectedServer}
                  selectedServer={selectedServer}
                />
              </div>
              
              {/* Server Info Preview - 25% width on large screens */}
              <div className="flex-1 lg:flex-[0.25]">
                <ServerInfoCard server={selectedServer} />
              </div>
            </div>
            
            {/* Database View - Full width below */}
            <div>
              <ServerDatabaseView server={selectedServer} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;