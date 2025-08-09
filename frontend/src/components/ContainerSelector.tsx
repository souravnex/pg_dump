import { useState } from 'react';
import { Container, ConnectionStatus } from '../types';
import { ChevronDown, Box, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface ContainerSelectorProps {
  containers: Container[];
  selectedContainer: Container | null;
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  onContainerSelect: (container: Container) => void;
  onRefresh: () => void;
  disabled?: boolean;
}

export const ContainerSelector = ({
  containers,
  selectedContainer,
  connectionStatus,
  isLoading,
  onContainerSelect,
  onRefresh,
  disabled = false
}: ContainerSelectorProps) => {
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
          <Box className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Container</h2>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm text-muted-foreground">{getStatusText()}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading || disabled}
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
          disabled={containers.length === 0 || disabled}
        >
          <div className="flex items-center gap-3">
            {selectedContainer ? (
              <div>
                <div className="font-medium text-foreground">{selectedContainer.name}</div>
                <div className="text-sm text-muted-foreground">
                  ID: {selectedContainer.id}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">
                {disabled ? 'Select a server first' : 
                 containers.length === 0 ? 'No containers available' : 'Select a container...'}
              </div>
            )}
          </div>
          <ChevronDown 
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isOpen && containers.length > 0 && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-2 glass rounded-lg border border-glass-border shadow-glass z-50">
            <div className="p-2">
              {containers.map((container) => (
                <button
                  key={container.id}
                  onClick={() => {
                    onContainerSelect(container);
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-secondary/20 transition-smooth"
                >
                  <div className="font-medium text-foreground">{container.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ID: {container.id}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedContainer && (
        <div className="mt-4 p-4 glass-subtle rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <div className="font-medium">{selectedContainer.name}</div>
            </div>
            <div>
              <span className="text-muted-foreground">ID:</span>
              <div className="font-medium">{selectedContainer.id}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};