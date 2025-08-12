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
  Box as ContainerIcon,
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
  const contentCardRef = useRef<HTMLDivElement | null>(null);

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

  const handleTabClick = () => {
    // Smooth scroll to content card when tab is clicked
    setTimeout(() => {
      contentCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const getTotalDatabaseCount = () => hostDatabases.length + containerDatabases.length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Single Tabs Component for Both Selection and Content */}
      <Tabs defaultValue="containers" className="w-full space-y-6">
        {/* Tab Selection Card */}
        <div className="flex justify-center">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg w-[500px]">
            <CardContent className="p-8 flex justify-center">
             <TabsList className="grid w-full grid-cols-2 h-16 bg-white/70 backdrop-blur-sm rounded-xl shadow-inner">
               <TabsTrigger 
                 value="containers" 
                 onClick={handleTabClick}
                 className="flex items-center gap-3 text-sm font-medium py-4 px-6 rounded-lg transition-all duration-300 hover:bg-blue-100 hover:text-blue-800 hover:shadow-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105"
               >
                 <ContainerIcon className="h-5 w-5" />
                 <span className="font-semibold">Containers</span>
               </TabsTrigger>
               <TabsTrigger 
                 value="host" 
                 onClick={handleTabClick}
                 className="flex items-center gap-3 text-sm font-medium py-4 px-6 rounded-lg transition-all duration-300 hover:bg-green-100 hover:text-green-800 hover:shadow-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105"
               >
                 <ServerIcon className="h-5 w-5" />
                 <span className="font-semibold">Host</span>
               </TabsTrigger>
             </TabsList>
            </CardContent>
          </Card>
        </div>

        {/* Content Card */}
        <Card ref={contentCardRef}>
          <CardContent className="p-6">
            {/* Containers Tab */}
            <TabsContent value="containers">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    🐳 PostgreSQL Containers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row border rounded-lg overflow-hidden">
                    {/* Container List */}
                    <div className="w-full md:w-1/3 lg:w-1/4 border-r">
                      <ContainerSidebar
                        containers={containers}
                        loading={isLoadingContainers}
                        selectedContainer={selectedContainer}
                        onSelect={handleContainerSelect}
                      />
                    </div>

                    {/* Container Databases */}
                    <div className="flex-1 p-6">
                      {!selectedContainer ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-16">
                          <DatabaseIcon className="h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-lg font-medium text-gray-600 mb-1">
                            Select a container
                          </p>
                          <p className="text-gray-500">
                            to view its databases
                          </p>
                        </div>
                      ) : (
                        <div ref={databasesSectionRef} className="space-y-4">
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-1">
                              {selectedContainer.name}
                            </h2>
                            <p className="text-gray-600">
                              PostgreSQL databases inside this container
                            </p>
                          </div>
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

            {/* Host Tab */}
            <TabsContent value="host">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    🐘 Host Databases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-gray-600">
                      PostgreSQL databases running directly on the host
                    </p>
                  </div>
                  <HostDatabaseGrid
                    databases={hostDatabases}
                    isLoading={isLoadingHost}
                    serverName={server.name}
                    server={server}
                  />
                </CardContent>
              </Card>
            </TabsContent>
        </CardContent>
      </Card>
      </Tabs>
    </div>
  );
}
