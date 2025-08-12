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
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg backdrop-blur-sm h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md">
              <ServerIcon className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              🚀 Select Server
            </span>
          </CardTitle>
          <CardDescription className="text-gray-600 font-medium">
            Choose a PostgreSQL server to manage your databases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full rounded-lg bg-gradient-to-r from-gray-200 to-gray-300" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 shadow-lg backdrop-blur-sm h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg shadow-md">
              <ServerIcon className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-red-600 to-pink-700 bg-clip-text text-transparent">
              🚀 Select Server
            </span>
          </CardTitle>
          <CardDescription className="text-gray-600 font-medium">
            Choose a PostgreSQL server to manage your databases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert variant="destructive" className="border-red-300 bg-red-50/80 backdrop-blur-sm">
              <AlertTitle className="text-red-800 font-semibold">⚠️ Failed to load servers</AlertTitle>
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={handleRetry} 
              variant="outline"
              className="bg-gradient-to-r from-red-500 to-pink-600 text-white border-none"
            >
              🔄 Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-lg backdrop-blur-sm h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-bold">
          <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg shadow-md">
            <ServerIcon className="h-6 w-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
            🚀 Select Server
          </span>
        </CardTitle>
        <CardDescription className="text-gray-600 font-medium">
          Choose a PostgreSQL server to manage your databases
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
          <SelectTrigger className="h-12 bg-white/70 backdrop-blur-sm border-2 border-emerald-300 rounded-lg shadow-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            <SelectValue placeholder="🔍 Choose a server" className="text-gray-700 font-medium" />
          </SelectTrigger>
          <SelectContent className="bg-white/95 backdrop-blur-lg border-2 border-emerald-200 rounded-xl shadow-xl">
            {servers.map((server) => (
              <SelectItem 
                key={server.id} 
                value={server.id}
                className="rounded-lg m-1 p-3"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600">
                      {getStatusIcon(server.status)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">{server.name}</span>
                      <span className="text-sm text-gray-500 font-medium">
                        📡 {server.host}:{server.port}
                      </span>
                    </div>
                  </div>
                  <Badge 
                    variant={getStatusVariant(server.status)} 
                    className={`ml-2 font-semibold shadow-sm ${
                      server.status === 'online' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400' 
                        : server.status === 'offline'
                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-400'
                        : 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-yellow-400'
                    }`}
                  >
                    {server.status === 'online' ? '✅' : server.status === 'offline' ? '❌' : '⏳'} {server.status}
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