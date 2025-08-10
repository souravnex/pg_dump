import { useState } from 'react';
import { Server } from '@/types/api';
import { ServerSelector } from '@/components/ServerSelector';
import { ServerDatabaseView } from '@/components/ServerDatabaseView';
import { Database, Server as ServerIcon, Zap } from 'lucide-react';

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
              <Database className="h-8 w-8 text-white" />
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
              <Database className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Container & Host</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Real-time</span>
            </div>
          </div>
        </div>
        
        {/* Server Selection */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <ServerSelector
            onServerSelect={setSelectedServer}
            selectedServer={selectedServer}
          />
        </div>

        {/* Main Content */}
        {selectedServer && (
          <ServerDatabaseView server={selectedServer} />
        )}
      </div>
    </div>
  );
}

export default App;