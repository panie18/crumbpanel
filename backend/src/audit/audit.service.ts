import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(userId: string, action: string, details?: string, ip?: string) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ip,
      },
    });
  }

  async getLogs(limit: number = 100) {
    return this.prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
