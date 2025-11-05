import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Square, RotateCw, FileText } from 'lucide-react';
import { serversApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ConsoleTerminal from '@/components/ConsoleTerminal';
import MetricsChart from '@/components/MetricsChart';
import PlayersList from '@/components/PlayersList';
import { getStatusBadgeClass } from '@/lib/utils';

export default function ServerDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  const { data: server, isLoading } = useQuery({
    queryKey: ['server', id],
    queryFn: () => serversApi.findById(id!),
    enabled: !!id,
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
        <p className="text-muted-foreground">Server not found</p>
      </div>
    );
  }

  const serverData = server.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/servers')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text">
              {serverData?.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={getStatusBadgeClass(serverData?.status)}>
                {serverData?.status}
              </Badge>
              <span className="text-muted-foreground">
                Version {serverData?.version}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {serverData?.status === 'STOPPED' && (
              <Button>
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
            )}
            {serverData?.status === 'RUNNING' && (
              <>
                <Button variant="glass">
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
                <Button variant="glass">
                  <RotateCw className="w-4 h-4 mr-2" />
                  Restart
                </Button>
              </>
            )}
            <Button
              variant="glass"
              onClick={() => navigate(`/files/${id}`)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Files
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Server Port</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{serverData?.port}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">RCON Port</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{serverData?.rconPort}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Max RAM</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{serverData?.maxRam} MB</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="console" className="space-y-4">
        <TabsList>
          <TabsTrigger value="console">Console</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="console">
          <ConsoleTerminal serverId={id!} />
        </TabsContent>

        <TabsContent value="players">
          <PlayersList serverId={id!} />
        </TabsContent>

        <TabsContent value="metrics">
          <MetricsChart serverId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
