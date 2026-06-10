import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { NotificationConsumerService } from './infrastructure/notification-consumer.service';
import { NotificationHealthController } from './infrastructure/notification-health.controller';
import { EmailService } from './infrastructure/email.service';

@Module({
  imports: [QueueModule],
  controllers: [NotificationHealthController],
  providers: [NotificationConsumerService, EmailService],
  exports: [],
})
export class NotificationsModule {}
