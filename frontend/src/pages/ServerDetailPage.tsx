import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play, Square, RotateCw, Settings, Trash2 } from 'lucide-react';
import { serversApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlayersList from '@/components/PlayersList';
import MetricsChart from '@/components/MetricsChart';
import { loadSatoshiFont } from '@/components/ui/typography';
import toast from 'react-hot-toast';

export default function ServerDetailPage() {
  loadSatoshiFont();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: server, isLoading } = useQuery({
    queryKey: ['server', id],
    queryFn: () => serversApi.findById(id!),
    enabled: !!id,
  });

  const startMutation = useMutation({
    mutationFn: () => serversApi.start(id!),
    onSuccess: () => {
      toast.success('Server starting...');
      queryClient.invalidateQueries({ queryKey: ['server', id] });
    },
    onError: () => toast.error('Failed to start server'),
  });

  const stopMutation = useMutation({
    mutationFn: () => serversApi.stop(id!),
    onSuccess: () => {
      toast.success('Server stopping...');
      queryClient.invalidateQueries({ queryKey: ['server', id] });
    },
    onError: () => toast.error('Failed to stop server'),
  });

  const restartMutation = useMutation({
    mutationFn: () => serversApi.restart(id!),
    onSuccess: () => {
      toast.success('Server restarting...');
      queryClient.invalidateQueries({ queryKey: ['server', id] });
    },
    onError: () => toast.error('Failed to restart server'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => serversApi.delete(id!),
    onSuccess: () => {
      toast.success('Server deleted!');
      navigate('/servers');
    },
    onError: () => toast.error('Failed to delete server'),
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!server?.data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Server not found</p>
          <Button onClick={() => navigate('/servers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Servers
          </Button>
        </div>
      </div>
    );
  }

  const serverData = server.data;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/servers')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{serverData.name}</h2>
            <p className="text-muted-foreground">Minecraft {serverData.version}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {serverData.status === 'STOPPED' ? (
            <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          ) : (
            <Button variant="outline" onClick={() => stopMutation.mutate()} disabled={stopMutation.isPending}>
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => restartMutation.mutate()} 
            disabled={restartMutation.isPending || serverData.status === 'STOPPED'}
          >
            <RotateCw className="w-4 h-4 mr-2" />
            Restart
          </Button>
          
          <Button variant="outline" onClick={() => navigate(`/files/${id}`)}>
            <Settings className="w-4 h-4 mr-2" />
            Files
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => deleteMutation.mutate()} 
            disabled={deleteMutation.isPending}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Server Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Server Status
            <Badge variant={serverData.status === 'RUNNING' ? 'default' : 'secondary'}>
              {serverData.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{serverData.port}</p>
              <p className="text-sm text-muted-foreground">Port</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{serverData.maxRam}GB</p>
              <p className="text-sm text-muted-foreground">Max RAM</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{serverData.players?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Players</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">20</p>
              <p className="text-sm text-muted-foreground">TPS</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="console">Console</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <MetricsChart serverId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Player Management</CardTitle>
            </CardHeader>
            <CardContent>
              <PlayersList serverId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="console" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Server Console</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 font-mono p-4 rounded min-h-[400px] max-h-[400px] overflow-y-auto">
                <p>[Server] Server started successfully</p>
                <p>[Server] Loading world...</p>
                <p>[Server] World loaded</p>
                <p>[Server] Server is ready</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Server Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Server configuration will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
