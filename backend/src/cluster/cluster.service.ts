import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entities/server.entity';

export interface ClusterNode {
  id: string;
  name: string;
  host: string;
  port: number;
  status: 'online' | 'offline' | 'error';
  servers: Server[];
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

export interface ProxyConfig {
  type: 'bungeecord' | 'velocity';
  servers: {
    name: string;
    address: string;
    port: number;
    restricted: boolean;
  }[];
}

@Injectable()
export class ClusterService {
  private nodes = new Map<string, ClusterNode>();

  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
  ) {}

  /**
   * Register a new cluster node
   */
  async registerNode(node: ClusterNode) {
    this.nodes.set(node.id, node);
    console.log(`✅ [CLUSTER] Node registered: ${node.name} (${node.host})`);
  }

  /**
   * Get all cluster nodes
   */
  getAllNodes(): ClusterNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get total cluster resources
   */
  getClusterResources(): {
    totalServers: number;
    onlineServers: number;
    totalCPU: number;
    totalMemory: number;
    usedMemory: number;
  } {
    const nodes = this.getAllNodes();
    
    return {
      totalServers: nodes.reduce((sum, node) => sum + node.servers.length, 0),
      onlineServers: nodes.filter(n => n.status === 'online').length,
      totalCPU: nodes.reduce((sum, node) => sum + node.resources.cpu, 0),
      totalMemory: nodes.reduce((sum, node) => sum + node.resources.memory, 0),
      usedMemory: nodes.reduce((sum, node) => sum + (node.resources.memory * 0.6), 0)
    };
  }

  /**
   * Generate BungeeCord/Velocity config
   */
  async generateProxyConfig(type: 'bungeecord' | 'velocity'): Promise<ProxyConfig> {
    const servers = await this.serverRepository.find();
    
    const proxyServers = servers.map(server => ({
      name: server.name,
      address: 'localhost', // TODO: Get from cluster node
      port: server.port,
      restricted: false
    }));

    return {
      type,
      servers: proxyServers
    };
  }

  /**
   * Distribute servers across cluster nodes
   */
  async balanceServers(): Promise<void> {
    console.log('⚖️ [CLUSTER] Balancing servers across nodes...');
    
    const nodes = this.getAllNodes().filter(n => n.status === 'online');
    const servers = await this.serverRepository.find();

    if (nodes.length === 0) {
      console.warn('⚠️ [CLUSTER] No online nodes available');
      return;
    }

    // Simple round-robin distribution
    servers.forEach((server, index) => {
      const nodeIndex = index % nodes.length;
      const targetNode = nodes[nodeIndex];
      
      console.log(`📍 [CLUSTER] Assigning ${server.name} to ${targetNode.name}`);
      // TODO: Actually move server to node
    });

    console.log('✅ [CLUSTER] Server balancing complete');
  }
}
