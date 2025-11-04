import { prisma } from '../prisma';

export class ServerService {
  async list() {
    return prisma.server.findMany({
      include: { players: true, backups: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data: {
    name: string; path: string; port: number; rconPort: number;
    rconPassword: string; version: string; maxRam: number;
  }) {
    return prisma.server.create({ data: { status: 'stopped', ...data } });
  }
}
