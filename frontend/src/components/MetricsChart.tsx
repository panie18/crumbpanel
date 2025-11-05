import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { metricsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface MetricsChartProps {
  serverId?: string;
  timeRange?: string;
}

export default function MetricsChart({ serverId, timeRange = '24h' }: MetricsChartProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics', serverId, timeRange],
    queryFn: () =>
      serverId
        ? metricsApi.getServerMetrics(serverId, timeRange)
        : metricsApi.getOverallMetrics(timeRange),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const data = metrics?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="players" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="tps" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
