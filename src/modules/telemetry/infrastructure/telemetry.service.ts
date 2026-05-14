import { Inject, Injectable, Logger } from '@nestjs/common';
import { QUEUE_SERVICE } from '../../queue/queue.port';
import type { IQueueService } from '../../queue/queue.port';

const TELEMETRY_STREAM = 'telemetry:stream';

export interface TelemetryEvent {
  eventId: string;
  timestamp: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  userId: string | null;
  roleName: string | null;
  errorType: string | null;
}

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(@Inject(QUEUE_SERVICE) private readonly queue: IQueueService) {}

  async record(
    event: Omit<TelemetryEvent, 'eventId' | 'timestamp'>,
  ): Promise<void> {
    const telemetryEvent: TelemetryEvent = {
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event,
    };

    try {
      await this.queue.publish(
        TELEMETRY_STREAM,
        telemetryEvent as unknown as Record<string, unknown>,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to queue telemetry event: ${(error as Error).message}`,
      );
    }
  }
}
