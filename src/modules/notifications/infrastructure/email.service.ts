import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { RATE_LIMIT_MAX_PER_MINUTE } from '../domain/notification.types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;
  private readonly timestamps: number[] = [];

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY not set — emails will be logged, not sent',
      );
    }
    this.resend = new Resend(apiKey || 're_placeholder');
    this.from = process.env.EMAIL_FROM || 'noreply@sociotech.dev';
    if (!process.env.EMAIL_FROM) {
      this.logger.warn(
        'EMAIL_FROM not set — using default: noreply@sociotech.dev',
      );
    }
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    const windowStart = now - 60_000;
    while (this.timestamps.length > 0 && this.timestamps[0] < windowStart) {
      this.timestamps.shift();
    }
    if (this.timestamps.length >= RATE_LIMIT_MAX_PER_MINUTE) {
      return false;
    }
    this.timestamps.push(now);
    return true;
  }

  async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.checkRateLimit()) {
      this.logger.warn(`Rate limit exceeded for ${to}: ${subject}`);
      return { success: false, error: 'Rate limit exceeded' };
    }

    if (!process.env.RESEND_API_KEY) {
      this.logger.warn(`[EMAIL MOCK] To: ${to} | Subject: ${subject} — email NOT sent`);
      return { success: true };
    }

    const startMs = Date.now();

    try {
      this.logger.log(`Sending email to ${to}: ${subject}`);

      const { error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });

      const elapsed = Date.now() - startMs;

      if (error) {
        this.logger.warn(
          `Resend API error for ${to} (${elapsed}ms): ${error.message} — subject: "${subject}"`,
        );
        return { success: false, error: error.message };
      }

      this.logger.log(
        `Email sent successfully to ${to} (${elapsed}ms): ${subject}`,
      );
      return { success: true };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.warn(
        `Email send exception for ${to}: ${message} — subject: "${subject}"`,
      );
      return { success: false, error: message };
    }
  }
}
