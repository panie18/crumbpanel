import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, RefreshCw, Server, Download } from 'lucide-react';
import { serversApi } from '@/lib/api';
import ServerCard from '@/components/ServerCard';
import CreateServerDialog from '@/components/CreateServerDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadSatoshiFont } from '@/components/ui/typography';

export default function ServersPage() {
  loadSatoshiFont();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: servers, isLoading, refetch } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serversApi.getAll(),
    refetchInterval: 5000,
  });

  const onlineServers = servers?.data?.filter((s: any) => s.status === 'RUNNING').length || 0;
  const totalServers = servers?.data?.length || 0;
  const totalPlayers = servers?.data?.reduce((sum: number, server: any) => sum + (server.players?.length || 0), 0) || 0;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Server Management</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Server
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalServers}</div>
                <p className="text-xs text-muted-foreground">
                  {totalServers > 0 ? `+${totalServers} active` : 'No servers yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online Servers</CardTitle>
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{onlineServers}</div>
                <p className="text-xs text-muted-foreground">
                  {onlineServers}/{totalServers} running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">👥</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPlayers}</div>
                <p className="text-xs text-muted-foreground">
                  Across all servers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Server Uptime</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">⏱️</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalServers > 0 ? Math.round((onlineServers / totalServers) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average uptime
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Server Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Your Minecraft Servers</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : servers?.data?.length === 0 ? (
                <div className="text-center py-12">
                  <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No servers created yet</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create your first server
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {servers?.data?.map((server: any) => (
                    <ServerCard key={server.id} server={server} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateServerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
