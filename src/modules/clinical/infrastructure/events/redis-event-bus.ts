import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { IEventBus, DomainEvent } from './event-bus.interface';

@Injectable()
export class RedisEventBus implements IEventBus {
  private readonly logger = new Logger(RedisEventBus.name);
  private readonly redis: Redis;
  private readonly consumerRedis: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.warn(
            'Redis connection failed, events will not be published',
          );
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

    this.redis.on('error', (err) => {
      this.logger.warn(`Redis error: ${err.message}`);
    });

    this.consumerRedis.on('error', (err) => {
      this.logger.warn(`Redis consumer error: ${err.message}`);
    });
  }

  async publish(event: DomainEvent): Promise<void> {
    const eventData = {
      eventType: event.eventType,
      payload: JSON.stringify(event.payload),
      timestamp: (event.timestamp || new Date()).toISOString(),
    };

    try {
      await this.redis.xadd(
        event.streamName,
        '*',
        ...Object.entries(eventData).flat(),
      );
    } catch (error) {
      this.logger.warn(`Event publish failed: ${error.message}`);
    }
  }

  async createConsumerGroup(
    streamName: string,
    groupName: string,
  ): Promise<void> {
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
    try {
      await this.createConsumerGroup(streamName, consumerGroup);
    } catch (error) {
      this.logger.warn(
        `Cannot subscribe to ${streamName}: ${error.message}. Events will not be consumed.`,
      );
      return;
    }

    const processEvents = async () => {
      try {
        const results = await this.consumerRedis.xreadgroup(
          'GROUP',
          consumerGroup,
          consumerName,
          'COUNT',
          10,
          'BLOCK',
          5000,
          'STREAMS',
          streamName,
          '>',
        );

        if (results) {
          for (const [stream, messages] of results as Array<
            [string, Array<[string, string[]]>]
          >) {
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
