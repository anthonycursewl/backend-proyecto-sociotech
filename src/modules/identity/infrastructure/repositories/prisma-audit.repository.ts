import { Injectable } from '@nestjs/common';
import { AuditRepository, AuditLogEntry } from '@shared/common/audit-repository.port';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class PrismaAuditRepository implements AuditRepository {
  constructor(private readonly prisma: PrismaService) { }

  async log(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        id: entry.id || crypto.randomUUID(),
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        oldValues: entry.oldValues ?? undefined,
        newValues: entry.newValues ?? undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        timestamp: entry.timestamp,
      },
    });
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { timestamp: 'desc' },
    });
    return logs.map(this.toDomain);
  }

  async findByUserId(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    return logs.map(this.toDomain);
  }

  private toDomain(prismaLog: any): AuditLogEntry {
    return {
      id: prismaLog.id,
      userId: prismaLog.userId,
      action: prismaLog.action,
      entityType: prismaLog.entityType,
      entityId: prismaLog.entityId,
      oldValues: prismaLog.oldValues,
      newValues: prismaLog.newValues,
      ipAddress: prismaLog.ipAddress,
      userAgent: prismaLog.userAgent,
      timestamp: prismaLog.timestamp,
    };
  }
}