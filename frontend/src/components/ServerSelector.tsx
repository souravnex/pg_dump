import { useState, useEffect } from 'react';
import { Server as ServerIcon, Wifi, WifiOff, Clock } from 'lucide-react';
import { Server } from '@/types/api';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ServerSelectorProps {
  onServerSelect: (server: Server) => void;
  selectedServer?: Server;
}

export function ServerSelector({ onServerSelect, selectedServer }: ServerSelectorProps) {
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchServers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const serverList = await apiService.getServers();
        setServers(serverList);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch servers. Please check your connection.";
        setError(message);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchServers();
  }, [toast]);

  const handleRetry = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const serverList = await apiService.getServers();
      setServers(serverList);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch servers. Please check your connection.';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: Server['status']) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-status-online" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-status-offline" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-status-pending" />;
      default:
        return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: Server['status']): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'online':
        return 'default';
      case 'offline':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-medium transition-all duration-normal">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerIcon className="h-5 w-5" />
            Select Server
          </CardTitle>
          <CardDescription>
            Choose a PostgreSQL server to manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-medium transition-all duration-normal">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerIcon className="h-5 w-5" />
            Select Server
          </CardTitle>
          <CardDescription>Choose a PostgreSQL server to manage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>Failed to load servers</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={handleRetry} variant="outline">Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-medium transition-all duration-normal hover:shadow-large">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ServerIcon className="h-5 w-5 text-primary" />
          Select Server
        </CardTitle>
        <CardDescription>
          Choose a PostgreSQL server to manage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={selectedServer?.id}
          onValueChange={(value) => {
            const server = servers.find(s => s.id === value);
            if (server) onServerSelect(server);
          }}
        >
          <SelectTrigger className="transition-all duration-fast">
            <SelectValue placeholder="Choose a server" />
          </SelectTrigger>
          <SelectContent className="bg-popover border shadow-large">
            {servers.map((server) => (
              <SelectItem key={server.id} value={server.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(server.status)}
                    <div className="flex flex-col">
                      <span className="font-medium">{server.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {server.host}:{server.port}
                      </span>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(server.status)} className="ml-2">
                    {server.status}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}