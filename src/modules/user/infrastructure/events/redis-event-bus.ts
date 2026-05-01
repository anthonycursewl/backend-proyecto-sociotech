import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

export interface DomainEvent {
  streamName: string;
  eventType: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(
    streamName: string,
    consumerGroup: string,
    consumerName: string,
    handler: (event: DomainEvent) => Promise<void>,
  ): Promise<void>;
}

@Injectable()
export class RedisEventBus implements IEventBus, OnModuleInit {
  private readonly logger = new Logger(RedisEventBus.name);
  private readonly redis: Redis;
  private readonly consumerRedis: Redis;
  private isConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.warn('Redis connection failed, events will not be published');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 3,
    });

    this.consumerRedis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Redis connected');
    });

    this.redis.on('error', (err) => {
      this.logger.warn(`Redis error: ${err.message}`);
    });
  }

  async onModuleInit() {
    this.logger.log('RedisEventBus initialized');
  }

  async publish(event: DomainEvent): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, skipping event publish');
      return;
    }

    const eventData = {
      eventType: event.eventType,
      payload: JSON.stringify(event.payload),
      timestamp: (event.timestamp || new Date()).toISOString(),
    };

    await this.redis.xadd(
      event.streamName,
      '*',
      ...Object.entries(eventData).flat(),
    );
  }

  async createConsumerGroup(streamName: string, groupName: string): Promise<void> {
    try {
      await this.redis.xgroup('CREATE', streamName, groupName, '$', 'MKSTREAM');
    } catch (error) {
      if (!error.message?.includes('BUSYGROUP')) {
        throw error;
      }
    }
  }

  async subscribe(
    streamName: string,
    consumerGroup: string,
    consumerName: string,
    handler: (event: DomainEvent) => Promise<void>,
  ): Promise<void> {
    await this.createConsumerGroup(streamName, consumerGroup);

    const processEvents = async () => {
      try {
        const results = await this.consumerRedis.xreadgroup(
          'GROUP', consumerGroup, consumerName,
          'COUNT', 10,
          'BLOCK', 5000,
          'STREAMS', streamName, '>',
        );

        if (results) {
          for (const [stream, messages] of results as [string, Array<[string, string[]]>][]) {
            for (const [id, fields] of messages) {
              try {
                const event = this.parseEvent(stream, fields);
                await handler(event);
                await this.consumerRedis.xack(stream, consumerGroup, id);
              } catch (error) {
                console.error(`Error processing event ${id}:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error reading from stream:', error);
      }

      processEvents();
    };

    processEvents();
  }

  private parseEvent(streamName: string, fields: string[]): DomainEvent {
    const data: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      data[fields[i]] = fields[i + 1];
    }

    return {
      streamName,
      eventType: data.eventType || 'unknown',
      payload: JSON.parse(data.payload || '{}'),
      timestamp: new Date(data.timestamp),
    };
  }
}