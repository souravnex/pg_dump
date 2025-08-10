import { useState, useEffect } from 'react';
import { Database as DatabaseIcon, Download, User, FileText } from 'lucide-react';
import { Database, Container, Server } from '@/types/api';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { DownloadDialog } from './DownloadDialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface DatabaseGridProps {
  server: Server;
  container: Container;
}

export function DatabaseGrid({ server, container }: DatabaseGridProps) {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const databaseList = await apiService.getDatabases(server.id, container.id);
        setDatabases(databaseList);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch databases. Please check your connection.';
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

    fetchDatabases();
  }, [server.id, container.id, toast]);

  const handleRetry = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const databaseList = await apiService.getDatabases(server.id, container.id);
      setDatabases(databaseList);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch databases. Please check your connection.';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadClick = (database: Database) => {
    setSelectedDatabase(database);
    setIsDownloadDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            Databases
          </CardTitle>
          <CardDescription>
            Databases in {container.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
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
            <DatabaseIcon className="h-5 w-5" />
            Databases
          </CardTitle>
          <CardDescription>Databases in {container.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>Failed to load databases</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={handleRetry} variant="outline">Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (databases.length === 0) {
    return (
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            Databases
          </CardTitle>
          <CardDescription>
            No databases found in {container.name}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5 text-primary" />
            Databases
          </CardTitle>
          <CardDescription>
            Found {databases.length} database{databases.length !== 1 ? 's' : ''} in {container.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {databases.map((database) => (
              <Card
                key={database.name}
                className="transition-all duration-normal hover:shadow-glow hover:scale-105"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DatabaseIcon className="h-4 w-4 text-primary" />
                    {database.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Owner:</span> {database.owner}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">Encoding:</span>
                      <Badge variant="secondary" className="text-xs">
                        {database.encoding}
                      </Badge>
                    </div>

                    {database.size && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Size:</span> {database.size}
                      </div>
                    )}

                    <Separator />

                    <Button
                      onClick={() => handleDownloadClick(database)}
                      className="w-full transition-all duration-fast"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Dump
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedDatabase && (
        <DownloadDialog
          isOpen={isDownloadDialogOpen}
          onClose={() => {
            setIsDownloadDialogOpen(false);
            setSelectedDatabase(null);
          }}
          server={server}
          container={container}
          database={selectedDatabase}
        />
      )}
    </>
  );
}