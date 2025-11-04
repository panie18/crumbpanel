import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface ConsoleTerminalProps {
  serverId: string;
}

export default function ConsoleTerminal({ serverId }: ConsoleTerminalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [command, setCommand] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5829';
    const newSocket = io(`${WS_URL}/console`, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      newSocket.emit('subscribe', serverId);
    });

    newSocket.on('log', (data: string) => {
      setLogs((prev) => [...prev, data]);
    });

    newSocket.on('commandResponse', (response: string) => {
      setLogs((prev) => [...prev, `> ${response}`]);
    });

    newSocket.on('error', (error: string) => {
      setLogs((prev) => [...prev, `ERROR: ${error}`]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('unsubscribe', serverId);
      newSocket.disconnect();
    };
  }, [serverId]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && socket) {
      socket.emit('command', { serverId, command });
      setLogs((prev) => [...prev, `$ ${command}`]);
      setCommand('');
    }
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="terminal h-[500px] p-4 overflow-y-auto">
        {logs.length === 0 && (
          <div className="text-muted-foreground">Waiting for logs...</div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="font-mono text-xs leading-relaxed">
            {log}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      <form onSubmit={handleSendCommand} className="glass-panel p-4 flex gap-2">
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter command..."
          className="flex-1 font-mono"
        />
        <Button type="submit" size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </Card>
  );
}
