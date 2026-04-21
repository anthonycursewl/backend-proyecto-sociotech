import { Injectable } from '@nestjs/common';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export interface NotificationProvider {
  sendNotification(token: PushToken, payload: NotificationPayload): Promise<boolean>;
  sendBatchNotifications(tokens: PushToken[], payload: NotificationPayload): Promise<number>;
}

@Injectable()
export class ExpoPushNotificationService implements NotificationProvider {
  private readonly accessToken: string;

  constructor() {
    this.accessToken = process.env.EXPO_ACCESS_TOKEN || '';
  }

  async sendNotification(token: PushToken, payload: NotificationPayload): Promise<boolean> {
    if (!this.accessToken) {
      console.log('Expo push notification (simulated):', { token, payload });
      return true;
    }

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          to: token.token,
          title: payload.title,
          body: payload.body,
          data: payload.data,
        }),
      });

      const result = await response.json();
      return response.ok && !result.errors;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  async sendBatchNotifications(tokens: PushToken[], payload: NotificationPayload): Promise<number> {
    if (!this.accessToken) {
      console.log('Expo push notifications (simulated):', { tokens: tokens.length, payload });
      return tokens.length;
    }

    let successCount = 0;

    const chunks = this.chunkArray(tokens, 100);

    for (const chunk of chunks) {
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify(
            chunk.map((token) => ({
              to: token.token,
              title: payload.title,
              body: payload.body,
              data: payload.data,
            })),
          ),
        });

        const result = await response.json();
        if (response.ok && !result.errors) {
          successCount += chunk.length;
        }
      } catch (error) {
        console.error('Failed to send batch push notifications:', error);
      }
    }

    return successCount;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}