import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UserX, Ban, RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PlayersListProps {
  serverId?: string;
}

export default function PlayersList({ serverId }: PlayersListProps) {
  const queryClient = useQueryClient();

  const { data: players, isLoading, refetch } = useQuery({
    queryKey: ['players', serverId],
    queryFn: () =>
      serverId ? playersApi.getByServer(serverId) : playersApi.getAll(),
    refetchInterval: 10000,
  });

  const banMutation = useMutation({
    mutationFn: (playerId: string) => playersApi.ban(playerId),
    onSuccess: () => {
      toast.success('Player banned successfully');
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
    onError: () => toast.error('Failed to ban player'),
  });

  const kickMutation = useMutation({
    mutationFn: (playerId: string) => playersApi.kick(playerId),
    onSuccess: () => {
      toast.success('Player kicked successfully');
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
    onError: () => toast.error('Failed to kick player'),
  });

  const playerList = players?.data || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Players</CardTitle>
          <Button variant="glass" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : playerList.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No players online
            </p>
          ) : (
            playerList.map((player: any) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
                    {player.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium">{player.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {player.status === 'online'
                        ? 'Online'
                        : `Last seen: ${formatDate(player.lastSeen)}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {player.isOnline && (
                    <Button
                      variant="outline" // Changed from "glass"
                      size="sm"
                      onClick={() => kickPlayerMutation.mutate(player.uuid)}
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => banMutation.mutate(player.id)}
                  >
                    <Ban className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
