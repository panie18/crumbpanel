import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { ServerPerformance } from './performance-monitor.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:8437', 'http://localhost:3000'],
    credentials: true,
  },
  namespace: '/servers'
})
export class ServersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private subscriptions = new Map<string, Set<string>>(); // serverId -> Set of socketIds

  handleConnection(client: Socket) {
    console.log(`🔌 [WS] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 [WS] Client disconnected: ${client.id}`);
    
    // Cleanup subscriptions
    this.subscriptions.forEach((sockets, serverId) => {
      sockets.delete(client.id);
    });
  }

  @SubscribeMessage('subscribe-server')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() { serverId }: { serverId: string }) {
    console.log(`📡 [WS] Client ${client.id} subscribing to server ${serverId}`);
    
    if (!this.subscriptions.has(serverId)) {
      this.subscriptions.set(serverId, new Set());
    }
    
    this.subscriptions.get(serverId)!.add(client.id);
    client.join(`server-${serverId}`);
  }

  @SubscribeMessage('unsubscribe-server')
  handleUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() { serverId }: { serverId: string }) {
    console.log(`📡 [WS] Client ${client.id} unsubscribing from server ${serverId}`);
    
    this.subscriptions.get(serverId)?.delete(client.id);
    client.leave(`server-${serverId}`);
  }

  /**
   * Broadcast log to all subscribed clients
   */
  broadcastLog(serverId: string, log: string) {
    this.server.to(`server-${serverId}`).emit('log', {
      serverId,
      log,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast performance update
   */
  @OnEvent('server.performance')
  handlePerformanceUpdate(data: ServerPerformance) {
    this.server.to(`server-${data.serverId}`).emit('performance', data);
  }

  /**
   * Broadcast status change
   */
  broadcastStatus(serverId: string, status: string) {
    this.server.to(`server-${serverId}`).emit('status', {
      serverId,
      status,
      timestamp: Date.now()
    });
  }
}
