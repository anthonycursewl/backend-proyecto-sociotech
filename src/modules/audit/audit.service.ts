import { Inject, Injectable, Logger } from '@nestjs/common';
import { QUEUE_SERVICE } from '../queue/queue.port';
import type { IQueueService } from '../queue/queue.port';
import type { AuditEvent } from './audit-event.interface';

const AUDIT_STREAM = 'audit:stream';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(QUEUE_SERVICE) private readonly queue: IQueueService) {}

  async record(
    event: Omit<AuditEvent, 'eventId' | 'timestamp'>,
  ): Promise<void> {
    const auditEvent: AuditEvent = {
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event,
    };

    try {
      await this.queue.publish(
        AUDIT_STREAM,
        auditEvent as unknown as Record<string, unknown>,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to queue audit event: ${(error as Error).message}`,
      );
    }
  }
}
