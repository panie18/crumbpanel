import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, TrendingUp, TrendingDown, Users, Activity, Database, Zap } from 'lucide-react';
import { serversApi } from '@/lib/api';
import ServerCard from '@/components/ServerCard';
import CreateServerDialog from '@/components/CreateServerDialog';
import DashboardWelcome from '@/components/DashboardWelcome';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ServersPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: servers, isLoading, refetch } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serversApi.getAll(),
    refetchInterval: 5000,
  });

  // Mock analytics data (replace with real data later)
  const analytics = [
    {
      title: "Total Servers",
      value: "12",
      change: "+20%",
      trend: "up",
      icon: Database,
      description: "from last month"
    },
    {
      title: "Active Players", 
      value: "2,350",
      change: "+180.1%",
      trend: "up",
      icon: Users,
      description: "from last month"
    },
    {
      title: "Server Uptime",
      value: "98.5%",
      change: "+19%",
      trend: "up", 
      icon: Activity,
      description: "from last month"
    },
    {
      title: "Resource Usage",
      value: "2.4TB",
      change: "+4.75%",
      trend: "up",
      icon: Zap,
      description: "from last month"
    }
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardWelcome />
      
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Server
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {analytics.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {item.title}
                </CardTitle>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={`inline-flex items-center ${
                    item.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {item.trend === 'up' ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    {item.change}
                  </span>
                  {' '}{item.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              📊 Server Performance Chart (Coming Soon)
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Server "Survival" started
                  </p>
                  <p className="text-sm text-muted-foreground">
                    2 minutes ago
                  </p>
                </div>
                <div className="ml-auto font-medium">+1</div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Player joined Creative
                  </p>
                  <p className="text-sm text-muted-foreground">
                    5 minutes ago
                  </p>
                </div>
                <div className="ml-auto font-medium">+1</div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Backup completed
                  </p>
                  <p className="text-sm text-muted-foreground">
                    12 minutes ago
                  </p>
                </div>
                <div className="ml-auto font-medium">✓</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Server Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Your Servers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : servers?.data?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No servers available</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create first server
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servers?.data?.map((server: any) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateServerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
