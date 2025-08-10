import { Database } from '@/types/api';
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

interface DatabaseGridProps {
  databases: Database[];
  isLoading: boolean;
  onDownload: (dbName: string, options?: any) => Promise<void>;
  sourceType: string;
  containerName?: string;
}

export function DatabaseGrid({ 
  databases, 
  isLoading, 
  onDownload, 
  sourceType, 
  containerName 
}: DatabaseGridProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5 text-blue-600" />
            {sourceType === 'container' ? 'Container Databases' : 'Databases'}
          </CardTitle>
          <CardDescription>
            {containerName ? `Loading databases from ${containerName}...` : 'Loading databases...'}
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {databases.map((database) => (
        <Card key={database.name} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <DatabaseIcon className="h-4 w-4 text-blue-600" />
                {database.name}
              </CardTitle>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                {sourceType === 'container' ? 'Container' : 'Database'}
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
                  onClick={() => onDownload(database.name)}
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
  );
}
