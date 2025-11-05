import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, CreditCard, DollarSign, Download, Users } from 'lucide-react';
import { serversApi } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Overview } from '@/components/overview';
import { RecentSales } from '@/components/recent-sales';
import { loadSatoshiFont } from '@/components/ui/typography';
import CreateServerDialog from '@/components/CreateServerDialog';

export default function ServersPage() {
  loadSatoshiFont();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: servers, isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serversApi.getAll(),
    refetchInterval: 30000,
  });

  const totalServers = servers?.data?.length || 0;
  const onlineServers = servers?.data?.filter((s: any) => s.status === 'RUNNING').length || 0;
  const totalPlayers = servers?.data?.reduce((sum: number, server: any) => sum + (server.players?.length || 0), 0) || 0;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="ml-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Add Server
          </Button>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Servers
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalServers}</div>
                <p className="text-xs text-muted-foreground">
                  +{totalServers} from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Online Servers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{onlineServers}</div>
                <p className="text-xs text-muted-foreground">
                  +{onlineServers} active now
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{totalPlayers}</div>
                <p className="text-xs text-muted-foreground">
                  +{Math.round(totalPlayers * 0.19)} from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Server Uptime
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {onlineServers > 0 ? Math.round((onlineServers / totalServers) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  +201 since last hour
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview servers={servers?.data || []} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  You have {totalServers} servers running.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales servers={servers?.data || []} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <CreateServerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
