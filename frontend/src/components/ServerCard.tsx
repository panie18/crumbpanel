import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, RotateCcw, Users, Database, Settings, Trash2, Activity } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serversApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useThemeStore } from '@/store/themeStore';
import toast from 'react-hot-toast';

interface ServerCardProps {
  server: {
    id: string;
    name: string;
    version: string;
    port: number;
    status: 'RUNNING' | 'STOPPED' | 'STARTING' | 'STOPPING';
    players?: any[];
    maxRam: number;
    rconPort: number;
  };
}

export default function ServerCard({ server }: ServerCardProps) {
  const { customPrimary, customAccent } = useThemeStore();
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: () => serversApi.start(server.id),
    onSuccess: () => {
      toast.success(`Server "${server.name}" started!`);
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
    onError: () => toast.error('Failed to start server')
  });

  const stopMutation = useMutation({
    mutationFn: () => serversApi.stop(server.id),
    onSuccess: () => {
      toast.success(`Server "${server.name}" stopped!`);
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
    onError: () => toast.error('Failed to stop server')
  });

  const restartMutation = useMutation({
    mutationFn: () => serversApi.restart(server.id),
    onSuccess: () => {
      toast.success(`Server "${server.name}" restarted!`);
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
    onError: () => toast.error('Failed to restart server')
  });

  const deleteMutation = useMutation({
    mutationFn: () => serversApi.delete(server.id),
    onSuccess: () => {
      toast.success(`Server "${server.name}" deleted!`);
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
    onError: () => toast.error('Failed to delete server')
  });

  const getStatusColor = () => {
    switch (server.status) {
      case 'RUNNING': return 'bg-green-500';
      case 'STOPPED': return 'bg-red-500';
      case 'STARTING': return 'bg-yellow-500';
      case 'STOPPING': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusVariant = () => {
    switch (server.status) {
      case 'RUNNING': return 'default';
      case 'STOPPED': return 'secondary';
      case 'STARTING': return 'outline';
      case 'STOPPING': return 'outline';
      default: return 'secondary';
    }
  };

  const isLoading = startMutation.isPending || stopMutation.isPending || 
                    restartMutation.isPending || deleteMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <Card className="relative overflow-hidden transition-all hover:shadow-lg">
        {/* Status indicator */}
        <div className={`absolute top-0 left-0 w-full h-1 ${getStatusColor()}`} />
        
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: customPrimary || '#000' }}
              />
              {server.name}
            </CardTitle>
            <Badge variant={getStatusVariant()}>
              {server.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Minecraft {server.version}</span>
            <span>Port {server.port}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center text-2xl font-bold mb-1">
                <Users className="w-5 h-5 mr-1 text-muted-foreground" />
                {server.players?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Players</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-2xl font-bold mb-1">
                <Database className="w-5 h-5 mr-1 text-muted-foreground" />
                {server.maxRam}GB
              </div>
              <p className="text-xs text-muted-foreground">RAM</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-2xl font-bold mb-1">
                <Activity className="w-5 h-5 mr-1 text-muted-foreground" />
                20
              </div>
              <p className="text-xs text-muted-foreground">TPS</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {server.status === 'STOPPED' ? (
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                onClick={() => startMutation.mutate()}
                disabled={isLoading}
                style={{ backgroundColor: customPrimary, color: customAccent }}
              >
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => stopMutation.mutate()}
                disabled={isLoading}
              >
                <Square className="w-4 h-4 mr-1" />
                Stop
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => restartMutation.mutate()}
              disabled={isLoading || server.status === 'STOPPED'}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.location.href = `/servers/${server.id}`}
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteMutation.mutate()}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
