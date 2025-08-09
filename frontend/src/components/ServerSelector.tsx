import { useState } from 'react';
import { Server, ConnectionStatus } from '../types';
import { ChevronDown, Server as ServerIcon, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface ServerSelectorProps {
  servers: Server[];
  selectedServer: Server | null;
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  onServerSelect: (server: Server) => void;
  onRefresh: () => void;
}

export const ServerSelector = ({
  servers,
  selectedServer,
  connectionStatus,
  isLoading,
  onServerSelect,
  onRefresh
}: ServerSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return <Wifi className="h-4 w-4 text-success" />;
      case ConnectionStatus.ERROR:
        return <WifiOff className="h-4 w-4 text-destructive" />;
      default:
        return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return 'Connected';
      case ConnectionStatus.ERROR:
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ServerIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Database Server</h2>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm text-muted-foreground">{getStatusText()}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full glass-subtle rounded-lg p-4 flex items-center justify-between hover:bg-secondary/10 transition-smooth"
          disabled={servers.length === 0}
        >
          <div className="flex items-center gap-3">
            {selectedServer ? (
              <div>
                <div className="font-medium text-foreground">{selectedServer.name}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedServer.host}:{selectedServer.port}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">
                {servers.length === 0 ? 'No servers available' : 'Select a server...'}
              </div>
            )}
          </div>
          <ChevronDown 
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isOpen && servers.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 glass rounded-lg border border-glass-border shadow-glass z-50">
            <div className="p-2">
              {servers.map((server) => (
                <button
                  key={server.id}
                  onClick={() => {
                    onServerSelect(server);
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-secondary/20 transition-smooth"
                >
                  <div className="font-medium text-foreground">{server.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {server.host}:{server.port}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedServer && (
        <div className="mt-4 p-4 glass-subtle rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Host:</span>
              <div className="font-medium">{selectedServer.host}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Port:</span>
              <div className="font-medium">{selectedServer.port}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};