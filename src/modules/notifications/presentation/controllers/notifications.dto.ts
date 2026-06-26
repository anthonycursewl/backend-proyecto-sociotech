import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class NotificationListQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  eventType?: string;
}

export interface NotificationItem {
  id: string;
  eventType: string;
  subject: string;
  body: string | null;
  status: string;
  recipientName: string | null;
  recipientEmail: string;
  sentAt: string | null;
  createdAt: string;
  errorMessage: string | null;
}

export interface PaginatedNotifications {
  data: NotificationItem[];
  nextCursor: string | null;
}
