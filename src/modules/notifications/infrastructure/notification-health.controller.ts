import { Controller, Get } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { NotificationConsumerService } from './notification-consumer.service';

@Controller('notifications')
export class NotificationHealthController {
  private readonly prisma: PrismaClient;

  constructor(private readonly consumer: NotificationConsumerService) {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  @Get('health')
  async health(): Promise<Record<string, unknown>> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const lastProcessed = this.consumer.getLastProcessedAt();
      const staleThreshold = Date.now() - 60_000;
      const isStale = lastProcessed && lastProcessed.getTime() < staleThreshold;

      return {
        status: isStale ? 'degraded' : 'healthy',
        lastProcessedAt: lastProcessed?.toISOString() || null,
        avgProcessTimeMs: Math.round(this.consumer.getAvgProcessTimeMs()),
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('metrics')
  async metrics(): Promise<Record<string, unknown>> {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const [total, sentToday, failedToday, dlqCount, pendingCount] =
      await Promise.all([
        this.prisma.notification.count(),
        this.prisma.notification.count({
          where: { status: 'SENT', createdAt: { gte: todayStart } },
        }),
        this.prisma.notification.count({
          where: { status: 'FAILED', createdAt: { gte: todayStart } },
        }),
        this.prisma.notification.count({
          where: { status: 'DLQ' },
        }),
        this.prisma.notification.count({
          where: { status: 'PENDING' },
        }),
      ]);

    return {
      total,
      sentToday,
      failedToday,
      inDlq: dlqCount,
      pending: pendingCount,
      lastProcessedAt:
        this.consumer.getLastProcessedAt()?.toISOString() || null,
      avgProcessTimeMs: Math.round(this.consumer.getAvgProcessTimeMs()),
      timestamp: now.toISOString(),
    };
  }
}
