import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { io, Socket } from 'socket.io-client';

interface PerformanceData {
  timestamp: number;
  tps: number;
  memoryPercent: number;
  players: number;
}

interface LivePerformanceChartProps {
  serverId: string;
}

export default function LivePerformanceChart({ serverId }: LivePerformanceChartProps) {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const API_URL = window.location.hostname === 'localhost' 
      ? 'http://localhost:5829'
      : '';
    
    const newSocket = io(`${API_URL}/servers`, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to performance WebSocket');
      newSocket.emit('subscribe-server', { serverId });
    });

    newSocket.on('performance', (perfData: any) => {
      setData(prev => {
        const updated = [...prev, {
          timestamp: perfData.timestamp,
          tps: perfData.tps,
          memoryPercent: perfData.memoryPercent,
          players: perfData.players
        }];
        
        // Keep only last 60 data points (1 minute if updates every second)
        return updated.slice(-60);
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('unsubscribe-server', { serverId });
      newSocket.disconnect();
    };
  }, [serverId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              labelFormatter={(ts) => new Date(ts).toLocaleTimeString()}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="tps" 
              stroke="#22c55e" 
              name="TPS"
              strokeWidth={2}
              dot={false}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="memoryPercent" 
              stroke="#ef4444" 
              name="Memory %"
              strokeWidth={2}
              dot={false}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="players" 
              stroke="#3b82f6" 
              name="Players"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
