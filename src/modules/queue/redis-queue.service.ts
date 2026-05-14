import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import type { IQueueService, QueueMessage } from './queue.port';

@Injectable()
export class RedisQueueService implements IQueueService {
  private readonly logger = new Logger(RedisQueueService.name);
  private readonly redis: Redis;
  private isConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.warn('Redis connection failed, queue unavailable');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Redis connected');
    });

    this.redis.on('close', () => {
      this.isConnected = false;
    });

    this.redis.on('error', (err) => {
      this.logger.warn(`Redis error: ${err.message}`);
    });

    void this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.redis.connect();
    } catch {
      this.logger.warn('Could not connect to Redis, queue will be unavailable');
    }
  }

  async publish(
    stream: string,
    data: Record<string, unknown>,
  ): Promise<string | null> {
    if (!this.isConnected) {
      this.logger.debug('Redis not connected, skipping publish');
      return null;
    }

    const fields: string[] = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(
        key,
        typeof value === 'string' ? value : JSON.stringify(value),
      );
    }

    try {
      return await this.redis.xadd(stream, '*', ...fields);
    } catch (error) {
      this.logger.warn(
        `Failed to publish to stream ${stream}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async consume(
    stream: string,
    group: string,
    consumer: string,
    batchSize: number,
  ): Promise<QueueMessage[]> {
    if (!this.isConnected) return [];

    try {
      const results = await this.redis.xreadgroup(
        'GROUP',
        group,
        consumer,
        'COUNT',
        batchSize,
        'BLOCK',
        1000,
        'STREAMS',
        stream,
        '>',
      );

      if (!results) return [];

      const messages: QueueMessage[] = [];
      for (const [, entries] of results as [
        string,
        Array<[string, string[]]>,
      ][]) {
        for (const [id, fields] of entries) {
          const data: Record<string, unknown> = {};
          for (let i = 0; i < fields.length; i += 2) {
            data[fields[i]] = fields[i + 1];
          }
          messages.push({
            id,
            stream,
            data,
            timestamp: new Date(),
          });
        }
      }
      return messages;
    } catch (error) {
      this.logger.warn(
        `Failed to consume from stream ${stream}: ${(error as Error).message}`,
      );
      return [];
    }
  }

  async ack(stream: string, group: string, messageId: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.redis.xack(stream, group, messageId);
    } catch (error) {
      this.logger.warn(
        `Failed to ack message ${messageId}: ${(error as Error).message}`,
      );
    }
  }

  async ensureGroup(stream: string, group: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.redis.xgroup('CREATE', stream, group, '$', 'MKSTREAM');
    } catch (error) {
      if (!(error as Error).message?.includes('BUSYGROUP')) {
        this.logger.warn(
          `Failed to create group ${group} for stream ${stream}: ${(error as Error).message}`,
        );
      }
    }
  }
}
