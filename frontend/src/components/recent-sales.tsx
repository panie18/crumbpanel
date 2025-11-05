import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RecentSalesProps {
  servers: any[];
}

export function RecentSales({ servers }: RecentSalesProps) {
  const recentActivity = [
    {
      name: 'Server "Survival" started',
      email: 'Started by admin',
      amount: '+1',
      avatar: 'SV',
    },
    {
      name: 'Player joined Creative',
      email: 'Player: steve_123',
      amount: '+1',
      avatar: 'CR',
    },
    {
      name: 'Backup completed',
      email: 'All servers backed up',
      amount: '✓',
      avatar: 'BK',
    },
    {
      name: 'Server "PVP" restarted',
      email: 'Scheduled restart',
      amount: '↻',
      avatar: 'PV',
    },
    {
      name: 'Plugin updated',
      email: 'WorldEdit v7.2.15',
      amount: '↑',
      avatar: 'PL',
    },
  ];

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
