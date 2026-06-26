import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  NotificationListQueryDto,
  PaginatedNotifications,
  NotificationItem,
} from './notifications.dto';
import { DEFAULT_PAGE_SIZE } from '@shared/constants';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    roleName: string;
  };
}

@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  private readonly prisma: PrismaClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  @Get()
  async findAll(
    @Query(new ValidationPipe({ transform: true }))
    query: NotificationListQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedNotifications> {
    const { cursor, limit = DEFAULT_PAGE_SIZE, status, eventType } = query;

    const where: Record<string, unknown> = {
      recipientEmail: req.user.email,
    };
    if (status) where.status = status;
    if (eventType) where.eventType = eventType;

    const items = await this.prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data: data.map((n) => this.toItem(n)),
      nextCursor,
    };
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<NotificationItem> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification || notification.recipientEmail !== req.user.email) {
      throw new NotFoundException('Notificación no encontrada');
    }
    return this.toItem(notification);
  }

  private toItem(n: {
    id: string;
    eventType: string;
    subject: string;
    body: string | null;
    status: string;
    recipientEmail: string;
    recipientName: string | null;
    sentAt: Date | null;
    createdAt: Date;
    errorMessage: string | null;
  }): NotificationItem {
    return {
      id: n.id,
      eventType: n.eventType,
      subject: n.subject,
      body: n.body,
      status: n.status,
      recipientName: n.recipientName,
      recipientEmail: n.recipientEmail,
      sentAt: n.sentAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
      errorMessage: n.errorMessage,
    };
  }
}
