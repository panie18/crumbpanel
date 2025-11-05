import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Ban, Shield, Crown, MessageSquare, Eye, RefreshCw } from 'lucide-react';
import { serversApi, playersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { loadSatoshiFont } from '@/components/ui/typography';

export default function PlayersPage() {
  loadSatoshiFont();
  const [searchTerm, setSearchTerm] = useState('');

  // Use real API call instead of mock data
  const { data: playersResponse, isLoading, refetch } = useQuery({
    queryKey: ['players'],
    queryFn: () => playersApi.getAll(),
    refetchInterval: 30000,
  });

  const { data: serversResponse } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serversApi.getAll(),
  });

  // Extract real data or use fallback
  const players = playersResponse?.data || [];
  const servers = serversResponse?.data || [];

  // Calculate real stats
  const onlinePlayers = players.filter((p: any) => p.status === 'online').length;
  const totalPlayers = players.length;
  const vipPlayers = players.filter((p: any) => p.rank === 'VIP' || p.rank === 'Admin').length;

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Admin': return 'bg-red-500 text-white';
      case 'VIP': return 'bg-yellow-500 text-black';
      case 'Member': return 'bg-gray-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Player Management</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search players..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="online">Online Players</TabsTrigger>
          <TabsTrigger value="bans">Bans & Kicks</TabsTrigger>
          <TabsTrigger value="ranks">Ranks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPlayers}</div>
                <p className="text-xs text-muted-foreground">
                  Ever joined your servers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online Now</CardTitle>
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{onlinePlayers}</div>
                <p className="text-xs text-muted-foreground">
                  Currently playing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">VIP Players</CardTitle>
                <Crown className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vipPlayers}</div>
                <p className="text-xs text-muted-foreground">
                  Premium members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Bans</CardTitle>
                <Ban className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Current banned players
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Player List</CardTitle>
              <p className="text-sm text-muted-foreground">
                {players.length > 0 ? `Showing ${players.length} players` : 'No players found'}
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Loading players...</span>
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No players yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Players will appear here once they join your servers
                  </p>
                  <Button onClick={() => refetch()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPlayers.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={player.avatar} alt={player.name} />
                          <AvatarFallback>{player.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{player.name}</h4>
                            <Badge className={getRankColor(player.rank)}>
                              {player.rank}
                            </Badge>
                            {player.status === 'online' && (
                              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {player.server ? `Playing on ${player.server}` : `Last seen: ${player.lastSeen}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Playtime: {player.playtime}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Ban className="w-4 h-4 mr-1" />
                          Ban
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
