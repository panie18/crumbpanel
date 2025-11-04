import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { RconService } from '../servers/rcon.service';
import { exec } from 'child_process';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/console',
})
export class ConsoleGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logStreams = new Map<string, any>();

  constructor(
    private prisma: PrismaService,
    private rconService: RconService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Stop any log streams for this client
    this.logStreams.forEach((stream, key) => {
      if (key.startsWith(client.id)) {
        stream.kill();
        this.logStreams.delete(key);
      }
    });
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(client: Socket, serverId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      client.emit('error', 'Server not found');
      return;
    }

    // Stream server logs
    const logFile = `${server.path}/logs/latest.log`;
    const tailProcess = exec(`tail -f ${logFile} 2>/dev/null || echo "Log file not found"`);

    const streamKey = `${client.id}_${serverId}`;
    this.logStreams.set(streamKey, tailProcess);

    tailProcess.stdout.on('data', (data) => {
      client.emit('log', data.toString());
    });

    tailProcess.on('error', (error) => {
      client.emit('error', error.message);
    });

    client.emit('subscribed', { serverId, message: 'Subscribed to console' });
  }

  @SubscribeMessage('command')
  async handleCommand(client: Socket, data: { serverId: string; command: string }) {
    try {
      const server = await this.prisma.server.findUnique({
        where: { id: data.serverId },
      });

      if (!server) {
        client.emit('error', 'Server not found');
        return;
      }

      const response = await this.rconService.sendCommand(server, data.command);
      client.emit('commandResponse', response);
    } catch (error) {
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, serverId: string) {
    const streamKey = `${client.id}_${serverId}`;
    const stream = this.logStreams.get(streamKey);
    
    if (stream) {
      stream.kill();
      this.logStreams.delete(streamKey);
    }

    client.emit('unsubscribed', { serverId });
  }
}
