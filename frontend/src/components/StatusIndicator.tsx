import { useEffect, useState } from 'react';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { apiService } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export function StatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiService.healthCheck();
        setIsOnline(true);
        setLastCheck(new Date());
      } catch (error) {
        setIsOnline(false);
        setLastCheck(new Date());
        if (isOnline !== false) { // Only show error on state change
          toast({
            title: "Connection Error",
            description: "Unable to connect to the API server.",
            variant: "destructive",
          });
        }
      }
    };

    // Initial check
    checkHealth();

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, [isOnline, toast]);

  if (isOnline === null) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Activity className="h-3 w-3 animate-pulse" />
        Connecting...
      </Badge>
    );
  }

  return (
    <Badge variant={isOnline ? "default" : "destructive"} className="gap-1">
      {isOnline ? (
        <Wifi className="h-3 w-3" />
      ) : (
        <WifiOff className="h-3 w-3" />
      )}
      {isOnline ? "Connected" : "Disconnected"}
      {lastCheck && (
        <span className="text-xs opacity-75">
          • {lastCheck.toLocaleTimeString()}
        </span>
      )}
    </Badge>
  );
}