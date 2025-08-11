import { useState } from 'react';
import { Download, FileText, Database as DatabaseIcon, Loader2 } from 'lucide-react';
import { Database, Container, Server, DumpOptions } from '@/types/api';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface DownloadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  server: Server;
  // container is optional now for host DBs
  container?: Container;
  database: Database;
  // flag to indicate host dump
  isHostDump?: boolean;
}

export function DownloadDialog({ isOpen, onClose, server, container, database, isHostDump = false }: DownloadDialogProps) {
  const [options, setOptions] = useState<DumpOptions>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      let blob: Blob | void;

      if (isHostDump) {
        // Host DB download
        await apiService.downloadHostDump(server.id, database.name, options);
      } else if (container) {
        // Container DB download
        blob = await apiService.downloadDump(server.id, container.id, database.name, options);
      } else {
        throw new Error('Container ID missing for container dump');
      }

      clearInterval(progressInterval);
      setDownloadProgress(100);

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const suffix = options.dataOnly ? '_data' : options.schemaOnly ? '_schema' : '_full';
        link.download = `${database.name}${suffix}_${timestamp}.sql`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: "Download Complete",
        description: `Database dump for ${database.name} has been downloaded successfully.`,
      });

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download database dump. Please try again.';
      toast({
        title: 'Download Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleOptionChange = (option: keyof DumpOptions, checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      [option]: checked
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Download Database Dump
          </DialogTitle>
          <DialogDescription>
            Configure options for downloading {database.name}{" "}
            {isHostDump ? `from host ${server.name}` : `from container ${container?.name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <DatabaseIcon className="h-4 w-4 text-primary" />
              <span className="font-medium">Database:</span> {database.name}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Owner:</span> {database.owner}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Encoding:</span> {database.encoding}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-base font-medium">Dump Options</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dataOnly"
                  checked={options.dataOnly || false}
                  onCheckedChange={(checked) => handleOptionChange('dataOnly', !!checked)}
                  disabled={options.schemaOnly}
                />
                <Label htmlFor="dataOnly" className="text-sm">
                  Data only (exclude schema)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schemaOnly"
                  checked={options.schemaOnly || false}
                  onCheckedChange={(checked) => handleOptionChange('schemaOnly', !!checked)}
                  disabled={options.dataOnly}
                />
                <Label htmlFor="schemaOnly" className="text-sm">
                  Schema only (exclude data)
                </Label>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              {!options.dataOnly && !options.schemaOnly && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Full dump (schema + data) will be downloaded
                </div>
              )}
            </div>
          </div>

          {isDownloading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Downloading...</span>
                <span>{downloadProgress}%</span>
              </div>
              <Progress value={downloadProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDownloading}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
