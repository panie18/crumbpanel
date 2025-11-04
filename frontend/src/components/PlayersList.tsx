import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UserX, Ban, RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PlayersListProps {
  serverId: string;
}

export default function PlayersList({ serverId }: PlayersListProps) {
  const queryClient = useQueryClient();

  const { data: players, refetch } = useQuery({
    queryKey: ['players', serverId],
    queryFn: () => playersApi.getAll(serverId),
    refetchInterval: 10000,
  });

  const kickMutation = useMutation({
    mutationFn: (playerName: string) => playersApi.kick(serverId, playerName),
    onSuccess: () => {
      toast.success('Player kicked');
      queryClient.invalidateQueries({ queryKey: ['players', serverId] });
    },
  });

  const banMutation = useMutation({
    mutationFn: (playerName: string) => playersApi.ban(serverId, playerName),
    onSuccess: () => {
      toast.success('Player banned');
      queryClient.invalidateQueries({ queryKey: ['players', serverId] });
    },
  });

  const pardonMutation = useMutation({
    mutationFn: (playerName: string) => playersApi.pardon(serverId, playerName),
    onSuccess: () => {
      toast.success('Ban removed');
      queryClient.invalidateQueries({ queryKey: ['players', serverId] });
    },
  });

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
          {players?.data?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No players found
            </p>
          ) : (
            players?.data?.map((player: any) => (
              <div
                key={player.id}
                className="glass-panel p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {player.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{player.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {player.isOnline ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          Online
                        </Badge>
                      ) : (
                        <span>Last seen: {formatDate(player.lastSeen)}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {player.isOnline && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => kickMutation.mutate(player.name)}
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => banMutation.mutate(player.name)}
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
