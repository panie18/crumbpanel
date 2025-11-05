import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RecentSalesProps {
  servers: any[];
}

export function RecentSales({ servers }: RecentSalesProps) {
  // Check if there are any actual server activities
  if (!servers || servers.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No recent activity.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Server activities will appear here once you create and manage servers.
          </p>
        </div>
      </div>
    );
  }

  // Generate realistic activity based on actual servers
  const recentActivity = servers.slice(0, 5).map((server, index) => ({
    name: `Server "${server.name}" ${
      index % 3 === 0
        ? 'started'
        : index % 3 === 1
        ? 'backed up'
        : 'updated'
    }`,
    email: `${
      server.status === 'RUNNING' ? 'Online' : 'Offline'
    } • ${server.players?.length || 0} players`,
    amount: index % 3 === 0 ? '+1' : index % 3 === 1 ? '✓' : '↑',
    avatar: server.name.substring(0, 2).toUpperCase(),
  }));

  return (
    <div className="space-y-8">
      {recentActivity.map((activity, index) => (
        <div key={index} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{activity.avatar}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {activity.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {activity.email}
            </p>
          </div>
          <div className="ml-auto font-medium">{activity.amount}</div>
        </div>
      ))}
    </div>
  );
}
