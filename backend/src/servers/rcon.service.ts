import { Injectable } from '@nestjs/common';
import { Rcon } from 'rcon-client';

@Injectable()
export class RconService {
  private connections = new Map<string, Rcon>();

  async connect(server: any, password: string): Promise<Rcon> {
    if (this.connections.has(server.id)) {
      return this.connections.get(server.id);
    }

    const rcon = await Rcon.connect({
      host: server.host,
      port: server.rconPort,
      password,
    });

    this.connections.set(server.id, rcon);
    return rcon;
  }

  async sendCommand(server: any, command: string): Promise<string> {
    try {
      const rcon = this.connections.get(server.id);
      if (!rcon) {
        throw new Error('RCON not connected');
      }

      const response = await rcon.send(command);
      return response;
    } catch (error) {
      throw new Error(`RCON command failed: ${error.message}`);
    }
  }

  async disconnect(serverId: string) {
    const rcon = this.connections.get(serverId);
    if (rcon) {
      await rcon.end();
      this.connections.delete(serverId);
    }
  }
}
