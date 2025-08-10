import { useState, useEffect } from 'react';
import { Server, Container, Database } from '@/types/api';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DatabaseGrid } from '@/components/DatabaseGrid';
import { HostDatabaseGrid } from '@/components/HostDatabaseGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database as DatabaseIcon, Container as ContainerIcon, Server as ServerIcon, Activity, HardDrive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ServerDatabaseViewProps {
  server: Server;
}

export function ServerDatabaseView({ server }: ServerDatabaseViewProps) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [hostDatabases, setHostDatabases] = useState<Database[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [containerDatabases, setContainerDatabases] = useState<Database[]>([]);
  const [isLoadingContainers, setIsLoadingContainers] = useState(true);
  const [isLoadingHost, setIsLoadingHost] = useState(true);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch containers when server changes
  useEffect(() => {
    const fetchContainers = async () => {
      try {
        setIsLoadingContainers(true);
        setError(null);
        const containerList = await apiService.getContainers(server.id);
        setContainers(containerList);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch containers';
        setError(message);
        toast({
          title: 'Error loading containers',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsLoadingContainers(false);
      }
    };

    fetchContainers();
  }, [server.id, toast]);

  // Fetch host databases when server changes
  useEffect(() => {
    const fetchHostDatabases = async () => {
      try {
        setIsLoadingHost(true);
        const databases = await apiService.getHostDatabases(server.id);
        setHostDatabases(databases);
      } catch (err) {
        console.log('Host PostgreSQL not available:', err);
        setHostDatabases([]);
      } finally {
        setIsLoadingHost(false);
      }
    };

    fetchHostDatabases();
  }, [server.id]);

  // Fetch container databases when container is selected
  useEffect(() => {
    const fetchContainerDatabases = async () => {
      if (!selectedContainer) {
        setContainerDatabases([]);
        return;
      }

      try {
        setIsLoadingDatabases(true);
        const databases = await apiService.getDatabases(server.id, selectedContainer.id);
        setContainerDatabases(databases);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch databases';
        toast({
          title: 'Error loading databases',
          description: message,
          variant: 'destructive',
        });
        setContainerDatabases([]);
      } finally {
        setIsLoadingDatabases(false);
      }
    };

    fetchContainerDatabases();
  }, [selectedContainer, server.id, toast]);

  const handleContainerSelect = (container: Container) => {
    setSelectedContainer(container);
  };

  const handleContainerDatabaseDownload = async (dbName: string, options?: any) => {
    // This function is no longer needed since DownloadDialog handles it internally
    console.log('Download handled by DownloadDialog component');
  };

  const handleHostDatabaseDownload = async (dbName: string, options?: any) => {
    try {
      await apiService.downloadHostDump(server.id, dbName, options);
      toast({
        title: 'Download started',
        description: `Downloading ${dbName} from host PostgreSQL`,
      });
    } catch (err) {
      toast({
        title: 'Download failed',
        description: err instanceof Error ? err.message : 'Failed to download host database',
        variant: 'destructive',
      });
    }
  };

  const getTotalDatabaseCount = () => {
    return hostDatabases.length + containerDatabases.length;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Server Header - Minimalistic Design */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
              <ServerIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">{server.name}</h2>
              <p className="text-slate-600 text-sm">{server.host}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200">
              <ContainerIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">{containers.length} containers</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200">
              <DatabaseIcon className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-700">{getTotalDatabaseCount()} databases</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs with Better Styling */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="grid w-fit grid-cols-3 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger 
              value="overview" 
              className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="containers" 
              className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Containers ({containers.length})
            </TabsTrigger>
            <TabsTrigger 
              value="host" 
              className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Host DB ({hostDatabases.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab - Enhanced Design */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Containers Card */}
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                    <ContainerIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  PostgreSQL Containers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {containers.length > 0 ? (
                  <div className="space-y-3">
                    {containers.map((container) => (
                      <div
                        key={container.id}
                        className="group flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200"
                        onClick={() => handleContainerSelect(container)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <DatabaseIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-800">{container.name}</span>
                            <p className="text-xs text-slate-500">{container.image}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={container.status === 'running' ? 'default' : 'secondary'}
                          className={container.status === 'running' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                        >
                          {container.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ContainerIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No containers found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Host PostgreSQL Card */}
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-lg">
                    <HardDrive className="h-4 w-4 text-emerald-600" />
                  </div>
                  Host PostgreSQL
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hostDatabases.length > 0 ? (
                  <div className="space-y-3">
                    {hostDatabases.slice(0, 5).map((database) => (
                      <div
                        key={database.name}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-lg">
                            <DatabaseIcon className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-800">{database.name}</span>
                            <p className="text-xs text-slate-500">Owner: {database.owner}</p>
                          </div>
                        </div>
                        <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {database.size}
                        </span>
                      </div>
                    ))}
                    {hostDatabases.length > 5 && (
                      <div className="text-center pt-2">
                        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                          +{hostDatabases.length - 5} more databases
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <HardDrive className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No host PostgreSQL found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Selected Container Databases */}
          {selectedContainer && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                    <DatabaseIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  Databases in {selectedContainer.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DatabaseGrid
                  databases={containerDatabases}
                  isLoading={isLoadingDatabases}
                  onDownload={handleContainerDatabaseDownload}
                  sourceType="container"
                  containerName={selectedContainer.name}
                  server={server}
                  container={selectedContainer}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Containers Tab */}
        <TabsContent value="containers">
          <div className="space-y-6">
            <ContainerGrid
              server={server}
              onContainerSelect={handleContainerSelect}
              selectedContainer={selectedContainer || undefined}
            />
            
            {selectedContainer && (
              <DatabaseGrid
                databases={containerDatabases}
                isLoading={isLoadingDatabases}
                onDownload={handleContainerDatabaseDownload}
                sourceType="container"
                containerName={selectedContainer.name}
                server={server}
                container={selectedContainer}
              />
            )}
          </div>
        </TabsContent>

        {/* Host PostgreSQL Tab */}
        <TabsContent value="host">
          <HostDatabaseGrid
            databases={hostDatabases}
            isLoading={isLoadingHost}
            onDownload={handleHostDatabaseDownload}
            serverName={server.name}
            server={server}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
