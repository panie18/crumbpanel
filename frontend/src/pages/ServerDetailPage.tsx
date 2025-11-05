import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play, Square, RotateCw, Settings, Trash2, Terminal, Send } from 'lucide-react';
import { serversApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import PlayersList from '@/components/PlayersList';
import MetricsChart from '@/components/MetricsChart';
import { loadSatoshiFont } from '@/components/ui/typography';
import toast from 'react-hot-toast';

export default function ServerDetailPage() {
  loadSatoshiFont();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [command, setCommand] = useState('');
  const consoleEndRef = useRef<HTMLDivElement>(null);
  
  const { data: server, isLoading } = useQuery({
    queryKey: ['server', id],
    queryFn: () => serversApi.findById(id!),
    enabled: !!id,
    refetchInterval: 3000, // Poll every 3 seconds for status updates
  });

  // Fetch server logs
  const { data: logsResponse, refetch: refetchLogs } = useQuery({
    queryKey: ['server-logs', id],
    queryFn: () => serversApi.getLogs(id!),
    enabled: !!id,
    refetchInterval: 2000, // Poll every 2 seconds for new logs
  });

  const logs = logsResponse?.data || [];

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

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

  const sendCommandMutation = useMutation({
    mutationFn: (cmd: string) => serversApi.sendCommand(id!, cmd),
    onSuccess: () => {
      setCommand('');
      refetchLogs();
    },
    onError: () => toast.error('Failed to send command'),
  });

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    
    if (serverData?.status !== 'RUNNING') {
      toast.error('Server must be running to send commands');
      return;
    }

    sendCommandMutation.mutate(command);
  };

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

  const getStatusColor = () => {
    switch (serverData.status) {
      case 'RUNNING': return 'bg-green-500';
      case 'STARTING': return 'bg-yellow-500 animate-pulse';
      case 'STOPPING': return 'bg-orange-500 animate-pulse';
      case 'INSTALLING': return 'bg-blue-500 animate-pulse';
      case 'ERROR': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/servers')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{serverData.name}</h2>
            <p className="text-muted-foreground">
              Minecraft {serverData.version} • {serverData.serverType === 'bedrock' ? 'Bedrock' : 'Java'} Edition
            </p>
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
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this server? This cannot be undone!')) {
                deleteMutation.mutate();
              }
            }}
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
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            Server Status: {serverData.status}
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
              <p className="text-2xl font-bold">{serverData.maxPlayers || 20}</p>
              <p className="text-sm text-muted-foreground">Max Players</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {serverData.serverType === 'bedrock' ? 'N/A' : '20'}
              </p>
              <p className="text-sm text-muted-foreground">TPS</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="console" className="space-y-4">
        <TabsList>
          <TabsTrigger value="console">
            <Terminal className="w-4 h-4 mr-2" />
            Console
          </TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="console" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Live Server Console
                </span>
                <Badge variant={serverData.status === 'RUNNING' ? 'default' : 'secondary'}>
                  {serverData.status === 'RUNNING' ? '🟢 Online' : '🔴 Offline'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Console Output */}
              <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg min-h-[400px] max-h-[400px] overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    {serverData.status === 'RUNNING' 
                      ? 'Waiting for server output...'
                      : serverData.status === 'STOPPED'
                      ? 'Server is stopped. Start the server to see logs.'
                      : serverData.status === 'INSTALLING'
                      ? 'Server is being installed. Please wait...'
                      : 'No logs available'
                    }
                  </div>
                ) : (
                  <>
                    {logs.map((log: string, index: number) => (
                      <div key={index} className="leading-relaxed hover:bg-green-900/20 px-2 py-0.5">
                        {log}
                      </div>
                    ))}
                    <div ref={consoleEndRef} />
                  </>
                )}
              </div>

              {/* Command Input */}
              <form onSubmit={handleSendCommand} className="flex gap-2">
                <Input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder={
                    serverData.status === 'RUNNING' 
                      ? 'Enter server command (e.g., say Hello, list, help)...'
                      : 'Server must be running to send commands'
                  }
                  disabled={serverData.status !== 'RUNNING' || sendCommandMutation.isPending}
                  className="flex-1 font-mono bg-black text-green-400 border-green-900 placeholder:text-green-700"
                />
                <Button 
                  type="submit" 
                  disabled={serverData.status !== 'RUNNING' || !command.trim() || sendCommandMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </form>

              {/* Quick Commands */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Quick commands:</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setCommand('list');
                    sendCommandMutation.mutate('list');
                  }}
                  disabled={serverData.status !== 'RUNNING'}
                >
                  list
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setCommand('help');
                    sendCommandMutation.mutate('help');
                  }}
                  disabled={serverData.status !== 'RUNNING'}
                >
                  help
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setCommand('tps');
                    sendCommandMutation.mutate('tps');
                  }}
                  disabled={serverData.status !== 'RUNNING'}
                >
                  tps
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setCommand('save-all');
                    sendCommandMutation.mutate('save-all');
                  }}
                  disabled={serverData.status !== 'RUNNING'}
                >
                  save-all
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Server Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Server Type</p>
                    <p className="text-sm text-muted-foreground">
                      {serverData.serverType === 'bedrock' ? '🧱 Bedrock Edition' : '☕ Java Edition'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Version</p>
                    <p className="text-sm text-muted-foreground">{serverData.version}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Port</p>
                    <p className="text-sm text-muted-foreground">{serverData.port}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Max RAM</p>
                    <p className="text-sm text-muted-foreground">{serverData.maxRam}GB</p>
                  </div>
                  {serverData.rconPort && (
                    <div>
                      <p className="text-sm font-medium">RCON Port</p>
                      <p className="text-sm text-muted-foreground">{serverData.rconPort}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">Server Path</p>
                    <p className="text-sm text-muted-foreground font-mono text-xs">
                      {serverData.serverPath}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
