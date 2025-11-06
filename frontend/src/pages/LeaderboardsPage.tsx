import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Clock, Sword, Skull, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';

export default function LeaderboardsPage() {
  const [selectedMetric, setSelectedMetric] = useState<'playtime' | 'kills' | 'deaths' | 'joins'>('playtime');
  
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', 'server-1', selectedMetric],
    queryFn: async () => {
      const response = await axios.get(`/api/leaderboards/server-1/${selectedMetric}`);
      return response.data;
    },
    refetchInterval: 30000,
  });

  const metrics = [
    { value: 'playtime', label: 'Most Playtime', icon: Clock },
    { value: 'kills', label: 'Most Kills', icon: Sword },
    { value: 'deaths', label: 'Most Deaths', icon: Skull },
    { value: 'joins', label: 'Most Active', icon: Users },
  ];

  const getMetricIcon = (metric: string) => {
    const found = metrics.find(m => m.value === metric);
    return found ? found.icon : Trophy;
  };

  const MetricIcon = getMetricIcon(selectedMetric);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Leaderboards
          </h2>
          <p className="text-muted-foreground">Top players on your server</p>
        </div>
        
        <Select value={selectedMetric} onValueChange={(v: any) => setSelectedMetric(v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {metrics.map(metric => (
              <SelectItem key={metric.value} value={metric.value}>
                <div className="flex items-center gap-2">
                  <metric.icon className="w-4 h-4" />
                  {metric.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MetricIcon className="w-5 h-5" />
            {metrics.find(m => m.value === selectedMetric)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard?.data?.map((entry: any) => (
                <div 
                  key={entry.uuid}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                      ${entry.rank === 1 ? 'bg-yellow-500 text-white' : ''}
                      ${entry.rank === 2 ? 'bg-gray-400 text-white' : ''}
                      ${entry.rank === 3 ? 'bg-orange-600 text-white' : ''}
                      ${entry.rank > 3 ? 'bg-muted text-muted-foreground' : ''}
                    `}>
                      {entry.rank === 1 && '🥇'}
                      {entry.rank === 2 && '🥈'}
                      {entry.rank === 3 && '🥉'}
                      {entry.rank > 3 && `#${entry.rank}`}
                    </div>
                    
                    <div>
                      <p className="font-semibold">{entry.username}</p>
                      <p className="text-sm text-muted-foreground">UUID: {entry.uuid.substring(0, 8)}...</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold">{entry.value}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMetric === 'playtime' && 'hours'}
                      {selectedMetric === 'kills' && 'kills'}
                      {selectedMetric === 'deaths' && 'deaths'}
                      {selectedMetric === 'joins' && 'joins'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
