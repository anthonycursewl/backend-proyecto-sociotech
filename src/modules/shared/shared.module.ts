import { Module } from '@nestjs/common';
import { ExpoPushNotificationService } from './infrastructure/notification/expo-push.service';

@Module({
  providers: [
    ExpoPushNotificationService,
    {
      provide: 'NotificationProvider',
      useClass: ExpoPushNotificationService,
    },
  ],
  exports: [
    ExpoPushNotificationService,
    'NotificationProvider',
  ],
})
export class SharedModule {}