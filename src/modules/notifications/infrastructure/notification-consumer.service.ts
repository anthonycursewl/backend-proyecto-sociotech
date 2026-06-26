import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { QUEUE_SERVICE } from '../../queue/queue.port';
import type { IQueueService } from '../../queue/queue.port';
import { EmailService } from './email.service';
import {
  NOTIFICATION_STREAM,
  NOTIFICATION_GROUP,
  NOTIFICATION_CONSUMER,
  DLQ_STREAM,
  DLQ_GROUP,
  POLL_INTERVAL_MS,
  BATCH_SIZE,
  calculateBackoffMs,
} from '../domain/notification.types';
import * as templates from './email-templates';

@Injectable()
export class NotificationConsumerService implements OnModuleInit {
  private readonly logger = new Logger(NotificationConsumerService.name);
  private readonly prisma: PrismaClient;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private processing = false;
  private lastProcessedAt: Date | null = null;
  private processTimes: number[] = [];

  constructor(
    @Inject(QUEUE_SERVICE) private readonly queue: IQueueService,
    private readonly emailService: EmailService,
  ) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      this.logger.warn('DATABASE_URL not set — notifications disabled');
    }
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.prisma.$connect();
    } catch (err) {
      this.logger.error(`Prisma connection failed: ${(err as Error).message}`);
      return;
    }

    await this.queue.ensureGroup(NOTIFICATION_STREAM, NOTIFICATION_GROUP);
    await this.queue.ensureGroup(DLQ_STREAM, DLQ_GROUP);

    this.logger.log('Notification consumer groups ensured');

    this.intervalId = setInterval(() => {
      if (this.processing) return;
      void this.processBatch().catch((err: Error) =>
        this.logger.error(`Notification cycle error: ${err.message}`),
      );
    }, POLL_INTERVAL_MS);

    this.logger.log(
      `Notification consumer started (interval: ${POLL_INTERVAL_MS}ms, batch: ${BATCH_SIZE})`,
    );

    await this.processBatch();
  }

  getLastProcessedAt(): Date | null {
    return this.lastProcessedAt;
  }

  getAvgProcessTimeMs(): number {
    if (this.processTimes.length === 0) return 0;
    const sum = this.processTimes.reduce((a, b) => a + b, 0);
    return sum / this.processTimes.length;
  }

  private async processBatch(): Promise<void> {
    this.processing = true;
    const batchStart = Date.now();

    try {
      const messages = await this.queue.consume(
        NOTIFICATION_STREAM,
        NOTIFICATION_GROUP,
        NOTIFICATION_CONSUMER,
        BATCH_SIZE,
      );

      if (messages.length === 0) return;

      this.logger.log(
        `[CONSUMER] Processing batch of ${messages.length} messages`,
      );

      const results = await Promise.allSettled(
        messages.map((msg) => this.processMessage(msg.id, msg.data)),
      );

      let failed = 0;
      for (const r of results) {
        if (r.status === 'rejected') {
          failed++;
          this.logger.error(`Batch message rejected: ${r.reason}`);
        }
      }

      if (failed > 0) {
        this.logger.warn(
          `${failed}/${messages.length} messages failed in batch`,
        );
      }

      this.lastProcessedAt = new Date();
    } finally {
      const elapsed = Date.now() - batchStart;
      this.processTimes.push(elapsed);
      if (this.processTimes.length > 100) this.processTimes.shift();
      this.processing = false;
    }
  }

  private async processMessage(
    messageId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const type = data.type as string;
    const eventData = data.data
      ? (JSON.parse(data.data as string) as Record<string, unknown>)
      : {};
    const retryCount = (data._retryCount as number) || 0;
    const maxRetries = (data._maxRetries as number) ?? 3;

    this.logger.log(
      `[CONSUMER] Processing message ${messageId} (type: ${type}, attempt: ${retryCount + 1}/${maxRetries})`,
    );

    const result = await this.buildAndSend(type, eventData);

    const notification = await this.prisma.notification.create({
      data: {
        eventType: type,
        recipientEmail: result.email,
        recipientName: result.name,
        subject: result.subject,
        body: result.body,
        status: result.success ? 'SENT' : 'FAILED',
        errorMessage: result.error || null,
        retryCount: result.success ? 0 : retryCount + 1,
        maxRetries,
        lastAttemptAt: new Date(),
        sentAt: result.success ? new Date() : null,
      },
    });

    if (result.success) {
      await this.queue.ack(NOTIFICATION_STREAM, NOTIFICATION_GROUP, messageId);
      this.logger.log(
        `[EMAIL] ${notification.id} (${type}) sent to ${result.email} — "${result.subject}"`,
      );
      return;
    }

    const attempt = retryCount + 1;

    if (attempt < maxRetries) {
      const backoffMs = calculateBackoffMs(retryCount);
      this.logger.warn(
        `[CONSUMER] ${notification.id} (${type}) failed for ${result.email} (attempt ${attempt}/${maxRetries}): ${result.error}. Retrying in ${backoffMs}ms`,
      );
      await this.queue.ack(NOTIFICATION_STREAM, NOTIFICATION_GROUP, messageId);
      setTimeout(() => {
        void this.queue
          .publish(NOTIFICATION_STREAM, {
            ...data,
            _retryCount: attempt,
            _maxRetries: maxRetries,
          })
          .then((newMsgId) => {
            if (newMsgId) {
              this.logger.log(
                `[CONSUMER] ${notification.id} (${type}) re-queued as ${newMsgId} for retry ${attempt + 1}/${maxRetries}`,
              );
            } else {
              this.logger.error(
                `[CONSUMER] ${notification.id} (${type}) could not be re-queued — queue unavailable`,
              );
            }
          })
          .catch((err: Error) =>
            this.logger.error(
              `[CONSUMER] ${notification.id} (${type}) failed to re-publish for retry: ${err.message}`,
            ),
          );
      }, backoffMs);
    } else {
      await this.queue.ack(NOTIFICATION_STREAM, NOTIFICATION_GROUP, messageId);
      await this.queue
        .publish(DLQ_STREAM, {
          ...data,
          originalMessageId: messageId,
          _retryCount: attempt,
          _maxRetries: maxRetries,
          _dlqReason: result.error || 'Max retries exceeded',
          _dlqMovedAt: new Date().toISOString(),
        })
        .then((dlqMsgId) => {
          if (dlqMsgId) {
            this.logger.warn(
              `[CONSUMER] ${notification.id} (${type}) moved to DLQ as ${dlqMsgId} after ${maxRetries} attempts. Last error: ${result.error}`,
            );
          } else {
            this.logger.error(
              `[CONSUMER] ${notification.id} (${type}) could not be moved to DLQ — queue unavailable`,
            );
          }
        })
        .catch((err: Error) =>
          this.logger.error(
            `[CONSUMER] ${notification.id} (${type}) failed to publish to DLQ: ${err.message}`,
          ),
        );
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'DLQ' },
      });
      this.logger.error(
        `[CONSUMER] ${notification.id} (${type}) to ${result.email} moved to DLQ after ${maxRetries} attempts. Last error: ${result.error}`,
      );
    }
  }

  private async buildAndSend(
    type: string,
    data: Record<string, unknown>,
  ): Promise<{
    email: string;
    name: string;
    subject: string;
    body: string;
    success: boolean;
    error?: string;
  }> {
    switch (type) {
      case 'APPOINTMENT_SCHEDULED':
        return this.handleAppointmentScheduled(data);
      case 'APPOINTMENT_CONFIRMED':
        return this.handleAppointmentConfirmed(data);
      case 'APPOINTMENT_CANCELLED':
        return this.handleAppointmentCancelled(data);
      case 'APPOINTMENT_RESCHEDULED':
        return this.handleAppointmentRescheduled(data);
      case 'APPOINTMENT_COMPLETED':
        return this.handleAppointmentCompleted(data);
      case 'USER_REGISTERED':
        return this.handleUserRegistered(data);
      case 'EMAIL_VERIFICATION':
        return this.handleEmailVerification(data);
      case 'LOGIN_DETECTED':
        return this.handleLoginDetected(data);
      case 'PASSWORD_CHANGED':
        return this.handlePasswordChanged(data);
      case 'PASSWORD_RESET':
        return this.handlePasswordReset(data);
      default:
        return {
          email: '',
          name: '',
          subject: '',
          body: '',
          success: false,
          error: `Unknown type: ${type}`,
        };
    }
  }

  private async handleEmailVerification(
    data: Record<string, unknown>,
  ): Promise<{
    email: string;
    name: string;
    subject: string;
    body: string;
    success: boolean;
    error?: string;
  }> {
    const email = data.email as string;
    const name = data.name as string;
    const code = data.code as string;
    const expiresInMinutes = (data.expiresInMinutes as number) || 10;

    if (!email || !code) {
      return {
        email: email || '',
        name: name || '',
        subject: '',
        body: '',
        success: false,
        error: 'Missing email or code for EMAIL_VERIFICATION',
      };
    }

    const template = templates.emailVerificationCode({
      name,
      code,
      expiresInMinutes,
    });

    const result = await this.emailService.send(
      email,
      template.subject,
      template.html,
    );

    return {
      email,
      name,
      subject: template.subject,
      body: template.html,
      success: result.success,
      error: result.error,
    };
  }

  private async sendToBoth(
    patientEmail: string,
    patientName: string,
    patientTemplate: { subject: string; html: string },
    doctorEmail: string,
    doctorName: string,
    doctorTemplate: { subject: string; html: string },
    mainRecipient: 'patient' | 'doctor' = 'patient',
  ): Promise<{
    email: string;
    name: string;
    subject: string;
    body: string;
    success: boolean;
    error?: string;
  }> {
    const [patientResult, doctorResult] = await Promise.allSettled([
      this.emailService.send(
        patientEmail,
        patientTemplate.subject,
        patientTemplate.html,
      ),
      this.emailService.send(
        doctorEmail,
        doctorTemplate.subject,
        doctorTemplate.html,
      ),
    ]);

    if (patientResult.status === 'rejected') {
      return {
        email: patientEmail,
        name: patientName,
        subject: patientTemplate.subject,
        body: patientTemplate.html,
        success: false,
        error: patientResult.reason?.message || 'Patient email send failed',
      };
    }

    if (
      doctorResult.status === 'rejected' ||
      (doctorResult.status === 'fulfilled' && !doctorResult.value.success)
    ) {
      this.logger.warn(
        `Doctor email failed for ${doctorEmail}: ${doctorResult.status === 'rejected' ? doctorResult.reason?.message : doctorResult.value.error}`,
      );
    }

    if (mainRecipient === 'patient') {
      return {
        email: patientEmail,
        name: patientName,
        subject: patientTemplate.subject,
        body: patientTemplate.html,
        success: patientResult.value.success,
        error: patientResult.value.error,
      };
    }

    const drVal =
      doctorResult.status === 'fulfilled'
        ? doctorResult.value
        : { success: false, error: 'Doctor send failed' };
    return {
      email: doctorEmail,
      name: doctorName,
      subject: doctorTemplate.subject,
      body: doctorTemplate.html,
      success: drVal.success,
      error: drVal.error,
    };
  }

  private async handleAppointmentScheduled(
    data: Record<string, unknown>,
  ): Promise<{
    email: string;
    name: string;
    subject: string;
    body: string;
    success: boolean;
    error?: string;
  }> {
    const patientId = data.patientId as string;
    const doctorId = data.doctorId as string;

    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true },
      }),
      this.prisma.doctor.findUnique({
        where: { id: doctorId },
        include: { user: true },
      }),
    ]);

    if (!patient || !doctor) {
      return {
        email: '',
        name: '',
        subject: '',
        body: '',
        success: false,
        error: 'Patient or doctor not found',
      };
    }

    const scheduledAt = new Date(data.scheduledAt as string);
    const date = scheduledAt.toLocaleDateString('es-DO', {
      timeZone: 'America/Santo_Domingo',
    });
    const time = scheduledAt.toLocaleTimeString('es-DO', {
      timeZone: 'America/Santo_Domingo',
      hour: '2-digit',
      minute: '2-digit',
    });
    const serviceName = (data.serviceName as string) || 'Consulta';

    const patientName = `${patient.user.firstName} ${patient.user.lastName}`;
    const doctorName = `${doctor.user.firstName} ${doctor.user.lastName}`;

    const patientTpl = templates.appointmentScheduledForPatient({
      patientName,
      doctorName,
      serviceName,
      date,
      time,
    });
    const doctorTpl = templates.appointmentScheduledForDoctor({
      doctorName,
      patientName,
      serviceName,
      date,
      time,
    });

    return this.sendToBoth(
      patient.user.email,
      patientName,
      patientTpl,
      doctor.user.email,
      doctorName,
      doctorTpl,
    );
  }

  private async handleAppointmentConfirmed(
    data: Record<string, unknown>,
  ): Promise<{
    email: string;
    name: string;
    subject: string;
    body: string;
    success: boolean;
    error?: string;
  }> {
    const patientId = data.patientId as string;
    const doctorId = data.doctorId as string;
    const serviceName = (data.serviceName as string) || 'Consulta';

    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true },
      }),
      this.prisma.doctor.findUnique({
        where: { id: doctorId },
        include: { user: true },
      }),
    ]);

    if (!patient || !doctor) {
      return {
        email: '',
        name: '',
        subject: '',
        body: '',
        success: false,
        error: 'Patient or doctor not found',
      };
    }

    const scheduledAt = new Date(data.scheduledAt as string);
    const date = scheduledAt.toLocaleDateString('es-DO', {
      timeZone: 'America/Santo_Domingo',
    });
    const time = scheduledAt.toLocaleTimeString('es-DO', {
      timeZone: 'America/Santo_Domingo',
      hour: '2-digit',
      minute: '2-digit',
    });

    const patientName = `${patient.user.firstName} ${patient.user.lastName}`;
    const doctorName = `${doctor.user.firstName} ${doctor.user.lastName}`;

    const patientTpl = templates.appointmentConfirmed({
      patientName,
      doctorName,
      serviceName,
      date,
      time,
    });

    const result = await this.emailService.send(
      patient.user.email,
      patientTpl.subject,
      patientTpl.html,
    );
    return {
      email: patient.user.email,
      name: patientName,
      subject: patientTpl.subject,
      body: patientTpl.html,
      success: result.success,
      error: result.error,
    };
  }

  private async handleAppointmentCancelled(
    data: Record<string, unknown>,
  ): Promise<{
    email: string;
    name: string;
    subject: string;
    body: string;
    success: boolean;
    error?: string;
  }> {
    const patientId = data.patientId as string;
    const doctorId = data.doctorId as string;
    const cancelledByDoctor = data.cancelledByDoctor === true;

    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true },
      }),
      this.prisma.doctor.findUnique({
        where: { id: doctorId },
        include: { user: true },
      }),
    ]);

    if (!patient || !doctor) {
      return {
        email: '',
        name: '',
        subject: '',
        body: '',
        success: false,
        error: 'Patient or doctor not found',
      };
    }

    const scheduledAt = new Date(data.scheduledAt as string);
    const date = scheduledAt.toLocaleDateString('es-DO', {
      timeZone: 'America/Santo_Domingo',
    });
    const reason = data.reason as string | undefined;

    const patientName = `${patient.user.firstName} ${patient.user.lastName}`;
    const doctorName = `${doctor.user.firstName} ${doctor.user.lastName}`;

    const patientTpl = templates.appointmentCancelled({
      patientName,
      doctorName,
      date,
      reason,
      cancelledByDoctor,
    });
    const doctorTpl = templates.appointmentCancelledForDoctor({
      doctorName,
      patientName,
      date,
      reason,
    });

    if (cancelledByDoctor) {
      const result = await this.emailService.send(
        patient.user.email,
        patientTpl.subject,
        patientTpl.html,
      );
      return {
        email: patient.user.email,
        name: patientName,
        subject: patientTpl.subject,
        body: patientTpl.html,
        success: result.success,
        error: result.error,
      };
    }

    return this.sendToBoth(
      patient.user.email,
      patientName,
      patientTpl,
      doctor.user.email,
      doctorName,
      doctorTpl,
    );
  }

  private async handleAppointmentRescheduled(
    data: Record<string, unknown>,
  ): Promise<{
    email: string;
    name: string;
    subject: string;
    body: string;
    success: boolean;
    error?: string;
  }> {
    const patientId = data.patientId as string;
    const doctorId = data.doctorId as string;

    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true },
      }),
      this.prisma.doctor.findUnique({
        where: { id: doctorId },
        include: { user: true },
      }),
    ]);

    if (!patient || !doctor) {
      return {
        email: '',
        name: '',
        subject: '',
        body: '',
        success: false,
        error: 'Patient or doctor not found',
      };
    }

    const oldDateFormatted = data.oldDate
      ? new Date(data.oldDate as string).toLocaleDateString('es-DO', {
          timeZone: 'America/Santo_Domingo',
        })
      : '';

    const newScheduledAt = new Date(data.scheduledAt as string);
    const newDate = newScheduledAt.toLocaleDateString('es-DO', {
      timeZone: 'America/Santo_Domingo',
    });
    const newTime = newScheduledAt.toLocaleTimeString('es-DO', {
      timeZone: 'America/Santo_Domingo',
      hour: '2-digit',
      minute: '2-digit',
    });

    const patientName = `${patient.user.firstName} ${patient.user.lastName}`;
    const doctorName = `${doctor.user.firstName} ${doctor.user.lastName}`;

    const patientTpl = templates.appointmentRescheduled({
      patientName,
      doctorName,
      oldDate: oldDateFormatted,
      newDate,
      newTime,
    });
    const doctorTpl = templates.appointmentRescheduled({
      patientName,
      doctorName,
      oldDate: oldDateFormatted,
      newDate,
      newTime,
      isDoctorNotification: true,
    });

    return this.sendToBoth(
      patient.user.email,
      patientName,
      patientTpl,
      doctor.user.email,
      doctorName,
      doctorTpl,
    );
  }

  private async handleUserRegistered(data: Record<string, unknown>): Promise<{
    email: string;
    name: string;
    subject: string;
    body: string;
    success: boolean;
    error?: string;
  }> {
    const userId = data.userId as string;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        email: '',
        name: '',
        subject: '',
        body: '',
        success: false,
        error: 'User not found',
      };
    }

    const template = templates.userRegistered({
      name: `${user.firstName} ${user.lastName}`,
    });

    const result = await this.emailService.send(
      user.email,
      template.subject,
      template.html,
    );

    return {
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      subject: template.subject,
      body: template.html,
      success: result.success,
      error: result.error,
    };
  }

  private async handleAppointmentCompleted(
    data: Record<string, unknown>,
  ): Promise<{
    email: string;
    name: string;
    subject: string;
    body: string;
    success: boolean;
    error?: string;
  }> {
    const patientId = data.patientId as string;
    const doctorId = data.doctorId as string;
    const serviceName = (data.serviceName as string) || 'Consulta';
    const scheduledAt = data.scheduledAt as string;

    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true },
      }),
      this.prisma.doctor.findUnique({
        where: { id: doctorId },
        include: { user: true },
      }),
    ]);

    if (!patient || !doctor) {
      return {
        email: '',
        name: '',
        subject: '',
        body: '',
        success: false,
        error: 'Patient or doctor not found',
      };
    }

    const date = new Date(scheduledAt).toLocaleDateString('es-DO', {
      timeZone: 'America/Santo_Domingo',
    });

    const patientName = `${patient.user.firstName} ${patient.user.lastName}`;
    const doctorName = `${doctor.user.firstName} ${doctor.user.lastName}`;

    const patientTpl = templates.appointmentCompleted({
      patientName,
      doctorName,
      serviceName,
      date,
    });

    const result = await this.emailService.send(
      patient.user.email,
      patientTpl.subject,
      patientTpl.html,
    );
    return {
      email: patient.user.email,
      name: patientName,
      subject: patientTpl.subject,
      body: patientTpl.html,
      success: result.success,
      error: result.error,
    };
  }

  private async handleLoginDetected(data: Record<string, unknown>): Promise<{
    email: string;
    name: string;
    subject: string;
    body: string;
    success: boolean;
    error?: string;
  }> {
    const email = data.email as string;
    const name = data.name as string;
    const ip = data.ip as string | undefined;
    const device = data.device as string | undefined;
    const time =
      (data.time as string) ||
      new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' });

    if (!email) {
      return {
        email: '',
        name: '',
        subject: '',
        body: '',
        success: false,
        error: 'Missing email for LOGIN_DETECTED',
      };
    }

    const template = templates.loginDetected({ name, email, time, ip, device });
    const result = await this.emailService.send(
      email,
      template.subject,
      template.html,
    );
    return {
      email,
      name,
      subject: template.subject,
      body: template.html,
      success: result.success,
      error: result.error,
    };
  }

  private async handlePasswordChanged(data: Record<string, unknown>): Promise<{
    email: string;
    name: string;
    subject: string;
    body: string;
    success: boolean;
    error?: string;
  }> {
    const email = data.email as string;
    const name = data.name as string;
    const time =
      (data.time as string) ||
      new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' });

    if (!email) {
      return {
        email: '',
        name: '',
        subject: '',
        body: '',
        success: false,
        error: 'Missing email for PASSWORD_CHANGED',
      };
    }

    const template = templates.passwordChanged({ name, time });
    const result = await this.emailService.send(
      email,
      template.subject,
      template.html,
    );
    return {
      email,
      name,
      subject: template.subject,
      body: template.html,
      success: result.success,
      error: result.error,
    };
  }

  private async handlePasswordReset(data: Record<string, unknown>): Promise<{
    email: string;
    name: string;
    subject: string;
    body: string;
    success: boolean;
    error?: string;
  }> {
    const email = data.email as string;
    const name = data.name as string;
    const code = data.code as string;
    const expiresInMinutes = (data.expiresInMinutes as number) || 15;

    if (!email || !code) {
      return {
        email: email || '',
        name: name || '',
        subject: '',
        body: '',
        success: false,
        error: 'Missing email or code for PASSWORD_RESET',
      };
    }

    const template = templates.passwordReset({ name, code, expiresInMinutes });
    const result = await this.emailService.send(
      email,
      template.subject,
      template.html,
    );
    return {
      email,
      name,
      subject: template.subject,
      body: template.html,
      success: result.success,
      error: result.error,
    };
  }
}
