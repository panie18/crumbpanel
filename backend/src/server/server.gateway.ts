import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ServerService } from './server.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:8437', 'http://localhost:3000'],
    credentials: true,
  },
})
export class ServerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private serverService: ServerService) {}

  handleConnection(client: Socket) {
    console.log(`🔌 [WEBSOCKET] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 [WEBSOCKET] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe-logs')
  async subscribeLogs(@ConnectedSocket() client: Socket, @MessageBody() { serverId }: { serverId: string }) {
    console.log(`📜 [WEBSOCKET] Subscribing to logs for server: ${serverId}`);
    
    client.join(`server-${serverId}`);
    
    // Send recent logs
    const logs = await this.serverService.getServerLogs(serverId, 50);
    client.emit('logs', { serverId, logs });
  }

  @SubscribeMessage('unsubscribe-logs')
  handleUnsubscribeLogs(@ConnectedSocket() client: Socket, @MessageBody() { serverId }: { serverId: string }) {
    console.log(`📜 [WEBSOCKET] Unsubscribing from logs for server: ${serverId}`);
    client.leave(`server-${serverId}`);
  }

  @SubscribeMessage('send-command')
  async handleSendCommand(@MessageBody() { serverId, command }: { serverId: string; command: string }) {
    console.log(`📝 [WEBSOCKET] Command for ${serverId}: ${command}`);
    await this.serverService.sendCommand(serverId, command);
  }

  // Method to broadcast logs from ServerService
  broadcastLog(serverId: string, log: string) {
    this.server.to(`server-${serverId}`).emit('log', { serverId, log });
  }

  // Method to broadcast status updates
  broadcastStatus(serverId: string, status: any) {
    this.server.to(`server-${serverId}`).emit('status', { serverId, status });
  }

  private server: any;
}
