import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QUEUE_SERVICE } from '../queue/queue.port';
import type { IQueueService } from '../queue/queue.port';
import { AuditLog } from './schemas/audit-log.schema';
import { TelemetryRecord } from './schemas/telemetry.schema';

const AUDIT_STREAM = 'audit:stream';
const TELEMETRY_STREAM = 'telemetry:stream';
const FLUSHER_GROUP = 'flusher-group';
const FLUSHER_CONSUMER = 'flusher-1';

@Injectable()
export class FlusherService implements OnModuleInit {
  private readonly logger = new Logger(FlusherService.name);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(QUEUE_SERVICE) private readonly queue: IQueueService,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
    @InjectModel(TelemetryRecord.name)
    private readonly telemetryModel: Model<TelemetryRecord>,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled = process.env.FLUSHER_ENABLED !== 'false';

    if (!enabled) {
      this.logger.log('Flusher disabled via FLUSHER_ENABLED=false');
      return;
    }

    await this.queue.ensureGroup(AUDIT_STREAM, FLUSHER_GROUP);
    await this.queue.ensureGroup(TELEMETRY_STREAM, FLUSHER_GROUP);

    const intervalMs = parseInt(process.env.FLUSHER_INTERVAL_MS || '5000', 10);

    this.intervalId = setInterval(() => {
      void this.flush().catch((err: Error) =>
        this.logger.warn(`Flush cycle error: ${err.message}`),
      );
    }, intervalMs);

    this.logger.log(`Flusher started (interval: ${intervalMs}ms)`);

    // Run first flush immediately
    await this.flush();
  }

  private async flush(): Promise<void> {
    await Promise.all([
      this.flushStream(AUDIT_STREAM, this.auditLogModel),
      this.flushStream(TELEMETRY_STREAM, this.telemetryModel),
    ]);
  }

  private async flushStream(
    stream: string,
    model: Model<AuditLog | TelemetryRecord>,
  ): Promise<void> {
    const batchSize = parseInt(process.env.FLUSHER_BATCH_SIZE || '100', 10);

    const messages = await this.queue.consume(
      stream,
      FLUSHER_GROUP,
      FLUSHER_CONSUMER,
      batchSize,
    );

    if (messages.length === 0) return;

    try {
      const docs = messages.map((msg) => ({
        ...msg.data,
        timestamp: msg.data.timestamp
          ? new Date(msg.data.timestamp as string)
          : new Date(),
      }));

      await model.insertMany(docs, { ordered: false });

      for (const msg of messages) {
        await this.queue.ack(stream, FLUSHER_GROUP, msg.id);
      }

      this.logger.debug(`Flushed ${messages.length} events from ${stream}`);
    } catch (error) {
      // If it's a duplicate key error, still ACK (already persisted)
      if (
        (error as Error).name === 'MongoServerError' &&
        (error as { code?: number }).code === 11000
      ) {
        for (const msg of messages) {
          await this.queue.ack(stream, FLUSHER_GROUP, msg.id);
        }
        this.logger.debug(`Acked ${messages.length} duplicates from ${stream}`);
        return;
      }

      this.logger.warn(
        `Failed to flush ${stream}: ${(error as Error).message}`,
      );
    }
  }
}
