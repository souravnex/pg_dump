import { useState, useEffect } from 'react';
import { Container as ContainerIcon, Play, Square, Pause, RotateCcw } from 'lucide-react';
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
        return <Play className="h-4 w-4 text-status-online" fill="currentColor" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-status-offline" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-status-pending" />;
      case 'restarting':
        return <RotateCcw className="h-4 w-4 text-status-pending animate-spin" />;
      default:
        return <Square className="h-4 w-4 text-muted-foreground" />;
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
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ContainerIcon className="h-5 w-5" />
            PostgreSQL Containers
          </CardTitle>
          <CardDescription>
            Containers on {server.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ContainerIcon className="h-5 w-5" />
            PostgreSQL Containers
          </CardTitle>
          <CardDescription>Containers on {server.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>Failed to load containers</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={handleRetry} variant="outline">Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (containers.length === 0) {
    return (
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ContainerIcon className="h-5 w-5" />
            PostgreSQL Containers
          </CardTitle>
          <CardDescription>
            No PostgreSQL containers found on {server.name}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ContainerIcon className="h-5 w-5 text-primary" />
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
              className={`cursor-pointer transition-all duration-normal hover:shadow-glow ${
                selectedContainer?.id === container.id 
                  ? 'ring-2 ring-primary shadow-glow' 
                  : 'hover:shadow-medium'
              }`}
              onClick={() => onContainerSelect(container)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getStatusIcon(container.status)}
                    {container.name}
                  </CardTitle>
                  <Badge variant={getStatusVariant(container.status)}>
                    {container.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Image:</span> {container.image}
                  </div>
                  {container.ports.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Ports:</span> {container.ports.join(', ')}
                    </div>
                  )}
                  <Separator />
                  <div className="text-xs text-muted-foreground">
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