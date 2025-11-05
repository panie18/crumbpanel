import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Ban, Shield, Crown, MessageSquare, Eye } from 'lucide-react';
import { serversApi } from '@/lib/api';
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

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serversApi.getAll(),
  });

  const mockPlayers = [
    { 
      id: 1, 
      name: 'Steve_Builder', 
      uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5',
      server: 'Survival Server',
      status: 'online',
      lastSeen: '2 minutes ago',
      playtime: '45h 23m',
      rank: 'VIP',
      avatar: 'https://crafatar.com/avatars/069a79f4-44e9-4726-a5be-fca90e38aaf5?size=32'
    },
    { 
      id: 2, 
      name: 'Alex_Miner', 
      uuid: '61699b2e-d327-4a01-9f1e-0ea8c3f06bc6',
      server: 'Creative World',
      status: 'online',
      lastSeen: '5 minutes ago',
      playtime: '23h 11m',
      rank: 'Member',
      avatar: 'https://crafatar.com/avatars/61699b2e-d327-4a01-9f1e-0ea8c3f06bc6?size=32'
    },
    { 
      id: 3, 
      name: 'Enderman_King', 
      uuid: 'f84c6a79-0a4e-45e0-879b-cd49ebd4c4e2',
      server: null,
      status: 'offline',
      lastSeen: '2 hours ago',
      playtime: '102h 45m',
      rank: 'Admin',
      avatar: 'https://crafatar.com/avatars/f84c6a79-0a4e-45e0-879b-cd49ebd4c4e2?size=32'
    },
  ];

  const onlinePlayers = mockPlayers.filter(p => p.status === 'online').length;
  const totalPlayers = mockPlayers.length;
  const vipPlayers = mockPlayers.filter(p => p.rank === 'VIP').length;

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Admin': return 'bg-red-500 text-white';
      case 'VIP': return 'bg-yellow-500 text-black';
      case 'Member': return 'bg-gray-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const filteredPlayers = mockPlayers.filter(player =>
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
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
