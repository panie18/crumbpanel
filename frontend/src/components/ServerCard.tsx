import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Square, RotateCw, Trash2, Users, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getStatusBadgeClass, formatBytes } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serversApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface ServerCardProps {
  server: any;
}

export default function ServerCard({ server }: ServerCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: () => serversApi.start(server.id),
    onSuccess: () => {
      toast.success('Server starting...');
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
    onError: () => toast.error('Error starting server'),
  });

  const stopMutation = useMutation({
    mutationFn: () => serversApi.stop(server.id),
    onSuccess: () => {
      toast.success('Server stopping...');
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
    onError: () => toast.error('Error stopping server'),
  });

  const restartMutation = useMutation({
    mutationFn: () => serversApi.restart(server.id),
    onSuccess: () => {
      toast.success('Server restarting...');
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
    onError: () => toast.error('Error restarting server'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => serversApi.delete(server.id),
    onSuccess: () => {
      toast.success('Server deleted');
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
    onError: () => toast.error('Error deleting server'),
  });

  const handleDelete = () => {
    if (confirm('Really delete this server?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="cursor-pointer" onClick={() => navigate(`/servers/${server.id}`)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{server.name}</CardTitle>
              <Badge className={getStatusBadgeClass(server.status)}>
                {server.status}
              </Badge>
            </div>
            <Activity className={`w-5 h-5 ${server.status === 'RUNNING' ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
          </div>
        </CardHeader>

        <CardContent onClick={(e) => e.stopPropagation()}>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Version:</span>
              <span className="font-mono">{server.version}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Port:</span>
              <span className="font-mono">{server.port}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">RAM:</span>
              <span className="font-mono">{formatBytes(server.maxRam * 1024 * 1024)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>{server._count?.players || 0} Players</span>
            </div>

            <div className="flex gap-2 pt-2">
              {server.status === 'STOPPED' && (
                <Button
                  size="sm"
                  variant="glass"
                  className="flex-1"
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </Button>
              )}

              {server.status === 'RUNNING' && (
                <>
                  <Button
                    size="sm"
                    variant="glass"
                    className="flex-1"
                    onClick={() => stopMutation.mutate()}
                    disabled={stopMutation.isPending}
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                  <Button
                    size="sm"
                    variant="glass"
                    onClick={() => restartMutation.mutate()}
                    disabled={restartMutation.isPending}
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </>
              )}

              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
