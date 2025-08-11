import { useState } from 'react';
import { Database, Server } from '@/types/api';
import { Database as DatabaseIcon, Download, Server as ServerIcon } from 'lucide-react';
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
import { DownloadDialog } from '@/components/DownloadDialog';

interface HostDatabaseGridProps {
  databases: Database[];
  isLoading: boolean;
  serverName: string;
  server: Server;
}

export function HostDatabaseGrid({ databases, isLoading, serverName, server }: HostDatabaseGridProps) {
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);

  const handleDownloadClick = (database: Database) => {
    setSelectedDatabase(database);
    setShowDownloadDialog(true);
  };

  const handleDownloadClose = () => {
    setShowDownloadDialog(false);
    setSelectedDatabase(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerIcon className="h-5 w-5 text-green-600" />
            Host PostgreSQL Databases
          </CardTitle>
          <CardDescription>Loading databases from host PostgreSQL...</CardDescription>
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

  if (databases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerIcon className="h-5 w-5 text-green-600" />
            Host PostgreSQL Databases
          </CardTitle>
          <CardDescription>No host PostgreSQL installation found on {serverName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ServerIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              PostgreSQL is not installed on the host system or not accessible.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerIcon className="h-5 w-5 text-green-600" />
            Host PostgreSQL Databases
          </CardTitle>
          <CardDescription>
            Found {databases.length} database{databases.length !== 1 ? 's' : ''} on host PostgreSQL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {databases.map((database) => (
              <Card key={database.name} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DatabaseIcon className="h-4 w-4 text-green-600" />
                      {database.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Host
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Owner:</span> {database.owner}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Encoding:</span> {database.encoding}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Size:</span> {database.size}
                    </div>
                    <div className="pt-2">
                      <Button
                        onClick={() => handleDownloadClick(database)}
                        size="sm"
                        className="w-full"
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Dump
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedDatabase && (
        <DownloadDialog
          isOpen={showDownloadDialog}
          onClose={handleDownloadClose}
          server={server}
          database={selectedDatabase}
          isHostDump={true}
        />
      )}
    </>
  );
}
