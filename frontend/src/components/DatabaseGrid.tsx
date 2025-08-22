import { useState } from 'react';
import { Database, Container, Server } from '@/types/api';
import { Database as DatabaseIcon, Download } from 'lucide-react';
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

interface DatabaseGridProps {
  databases: Database[];
  isLoading: boolean;
  sourceType: string;
  containerName?: string;
  server: Server;
  container: Container;
}

export function DatabaseGrid({ 
  databases, 
  isLoading, 
  sourceType, 
  containerName,
  server,
  container
}: DatabaseGridProps) {
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
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          {/* Loader Spinner */}
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-blue-600 font-medium">Loading...</p>
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
            <DatabaseIcon className="h-5 w-5 text-blue-600" />
            {sourceType === 'container' ? 'Container Databases' : 'Databases'}
          </CardTitle>
          <CardDescription>
            {containerName ? `No databases found in ${containerName}` : 'No databases found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DatabaseIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No databases found in this {sourceType}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
        {databases.map((database) => (
          <Card key={database.name} className="hover:shadow-md transition-shadow min-w-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 truncate">
                  <DatabaseIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{database.name}</span>
                </CardTitle>
                <Badge variant="outline" className="text-blue-600 border-blue-600 flex-shrink-0">
                  Container
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Owner:</span> <span className="truncate">{database.owner}</span>
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

      {selectedDatabase && (
        <DownloadDialog
          isOpen={showDownloadDialog}
          onClose={handleDownloadClose}
          server={server}
          container={container}
          database={selectedDatabase}
          isHostDump={false}
        />
      )}
    </>
  );
}
