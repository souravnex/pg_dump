import { useState, useEffect, useRef } from 'react';
import { Server, Container, Database } from '@/types/api';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { ContainerSidebar } from '@/components/ContainerSidebar';
import { DatabaseGrid } from '@/components/DatabaseGrid';
import { HostDatabaseGrid } from '@/components/HostDatabaseGrid';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs';

import {
  Database as DatabaseIcon,
  Box as ContainerIcon,       // FIX: use Box for container icon
  Server as ServerIcon,
  Activity
} from 'lucide-react';

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
  const { toast } = useToast();
  const databasesSectionRef = useRef<HTMLDivElement | null>(null);

  // Fetch containers
  useEffect(() => {
    const fetchContainers = async () => {
      try {
        setIsLoadingContainers(true);
        const containerList = await apiService.getContainers(server.id);
        setContainers(containerList);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch containers';
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

  // Fetch host databases
  useEffect(() => {
    const fetchHostDatabases = async () => {
      try {
        setIsLoadingHost(true);
        const databases = await apiService.getHostDatabases(server.id);
        setHostDatabases(databases);
      } catch (err) {
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

        // After data is loaded, smooth-scroll to the databases section
        setTimeout(() => {
          databasesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContainer, server.id, toast]);

  const handleContainerSelect = (container: Container) => {
    setSelectedContainer(container);
  };

  const getTotalDatabaseCount = () => hostDatabases.length + containerDatabases.length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Server Header */}
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

      {/* Tabs for Containers and Host */}
      <Tabs defaultValue="containers" className="w-full">
        <TabsList className="mb-4 flex gap-3">
          <TabsTrigger value="containers">Containers</TabsTrigger>
          <TabsTrigger value="host">Host</TabsTrigger>
        </TabsList>

        {/* ----- CONTAINERS TAB (side-by-side) ----- */}
        <TabsContent value="containers">
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
              <div className="flex flex-col md:flex-row border rounded-lg overflow-hidden">
                {/* LEFT: Container List */}
                <div className="w-full md:w-1/3 lg:w-1/4 border-r bg-white">
                  <ContainerSidebar
                    containers={containers}
                    loading={isLoadingContainers}
                    selectedContainer={selectedContainer}
                    onSelect={handleContainerSelect}
                  />
                </div>

                {/* RIGHT: Databases for selected container */}
                <div className="flex-1 p-4 bg-slate-50 overflow-auto">
                  {!selectedContainer ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                      <DatabaseIcon className="h-12 w-12 mb-4 text-slate-400" />
                      <p className="text-lg font-medium">
                        Select a container to view its databases
                      </p>
                    </div>
                  ) : (
                    <div ref={databasesSectionRef}>
                      <h2 className="text-xl font-semibold mb-2">
                        {selectedContainer.name} - Databases
                      </h2>
                      <p className="text-slate-500 mb-4">
                        PostgreSQL databases inside this container.
                      </p>
                      <DatabaseGrid
                        databases={containerDatabases}
                        isLoading={isLoadingDatabases}
                        sourceType="container"
                        containerName={selectedContainer.name}
                        server={server}
                        container={selectedContainer}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----- HOST TAB (unchanged) ----- */}
        <TabsContent value="host">
          <HostDatabaseGrid
            databases={hostDatabases}
            isLoading={isLoadingHost}
            serverName={server.name}
            server={server}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
