import { useState, useEffect } from 'react';
import { Database, Play, Square, Pause, RotateCcw } from 'lucide-react';
import { Container, Server } from '@/types/api';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ContainerGridProps {
  server: Server;
  onContainerSelect: (container: Container) => void;
  selectedContainer?: Container;
}

export function ContainerGrid({ server, onContainerSelect, selectedContainer }: ContainerGridProps) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchContainers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const containerList = await apiService.getContainers(server.id);
        setContainers(containerList);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch containers. Please check your connection.';
        setError(message);
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContainers();
  }, [server.id, toast]);

  // ADD MISSING HANDLE RETRY FUNCTION
  const handleRetry = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const containerList = await apiService.getContainers(server.id);
      setContainers(containerList);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch containers. Please check your connection.';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: Container['status']) => {
    switch (status) {
      case 'running':
        return <Play className="h-4 w-4 text-green-600" fill="currentColor" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-red-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'restarting':
        return <RotateCcw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Square className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusVariant = (status: Container['status']): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'running':
        return 'default';
      case 'stopped':
        return 'destructive';
      case 'paused':
      case 'restarting':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
              <Database className="h-4 w-4 text-blue-600" />
            </div>
            PostgreSQL Containers
          </CardTitle>
          <CardDescription>
            Loading containers from {server.name}...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
              <Database className="h-4 w-4 text-blue-600" />
            </div>
            PostgreSQL Containers
          </CardTitle>
          <CardDescription>Containers on {server.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertTitle>Failed to load containers</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={handleRetry} variant="outline" className="border-slate-300">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (containers.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
              <Database className="h-4 w-4 text-blue-600" />
            </div>
            PostgreSQL Containers
          </CardTitle>
          <CardDescription>
            No PostgreSQL containers found on {server.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Database className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg mb-2">No PostgreSQL containers</p>
            <p className="text-slate-400 text-sm">No running PostgreSQL containers detected on this server.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
            <Database className="h-4 w-4 text-blue-600" />
          </div>
          PostgreSQL Containers
        </CardTitle>
        <CardDescription>
          Found {containers.length} container{containers.length !== 1 ? 's' : ''} on {server.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {containers.map((container) => (
            <Card
              key={container.id}
              className={`cursor-pointer transition-all duration-200 border hover:shadow-md ${
                selectedContainer?.id === container.id 
                  ? 'border-blue-400 shadow-md bg-blue-50/30 ring-1 ring-blue-200' 
                  : 'border-slate-200 hover:border-blue-300'
              }`}
              onClick={() => onContainerSelect(container)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                      <Database className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{container.name}</div>
                      <div className="text-xs text-slate-500 font-normal">ID: {container.id}</div>
                    </div>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(container.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    <Badge 
                      variant={getStatusVariant(container.status)}
                      className={`${
                        container.status === 'running' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                          : container.status === 'stopped'
                          ? 'bg-red-100 text-red-700 hover:bg-red-100'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                      }`}
                    >
                      {container.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Image:</span> 
                    <span className="ml-1 text-slate-800">{container.image}</span>
                  </div>
                  {container.ports.length > 0 && (
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">Ports:</span>
                      <span className="ml-1 text-slate-800">{container.ports.join(', ')}</span>
                    </div>
                  )}
                  <Separator className="bg-slate-200" />
                  <div className="text-xs text-slate-500">
                    Created: {new Date(container.created).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
