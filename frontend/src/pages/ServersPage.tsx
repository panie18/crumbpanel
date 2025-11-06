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
  console.log('🎨 ServersPage rendering...');
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
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Servers</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Server
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {!isLoading && servers && servers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Server className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No servers yet</h3>
            <p className="text-muted-foreground mb-4">Create your first Minecraft server to get started</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Server
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && servers && servers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server: any) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}

      <CreateServerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
