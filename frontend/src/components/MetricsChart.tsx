import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { metricsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface MetricsChartProps {
  serverId: string;
}

export default function MetricsChart({ serverId }: MetricsChartProps) {
  const { data: metrics } = useQuery({
    queryKey: ['metrics', serverId],
    queryFn: () => metricsApi.getHistory(serverId, 20),
    refetchInterval: 30000,
  });

  const chartData = metrics?.data
    ?.slice()
    .reverse()
    .map((m: any) => ({
      time: new Date(m.timestamp).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      cpu: m.cpuUsage.toFixed(1),
      ram: m.ramUsage.toFixed(1),
      tps: m.tps.toFixed(1),
      players: m.players,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="time" 
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="cpu" 
              stroke="#22d3ee" 
              name="CPU %"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="ram" 
              stroke="#a855f7" 
              name="RAM %"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="tps" 
              stroke="#10b981" 
              name="TPS"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
